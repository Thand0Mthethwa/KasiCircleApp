package com.kasicircle.backend.users.images;

import com.kasicircle.backend.businesses.storage.ImageStorageService;
import com.kasicircle.backend.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@EnableScheduling
@ConditionalOnProperty(name = "app.avatar.cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class ProfileImageCleanupWorker {
    private static final Logger log = LoggerFactory.getLogger(ProfileImageCleanupWorker.class);
    private final ProfileImageCleanupRepository queue;
    private final UserRepository users;
    private final ImageStorageService storage;
    private final TransactionTemplate transactions;
    public ProfileImageCleanupWorker(ProfileImageCleanupRepository queue, UserRepository users,
            ImageStorageService storage, TransactionTemplate transactions) {
        this.queue = queue; this.users = users; this.storage = storage; this.transactions = transactions;
    }
    @Scheduled(initialDelayString = "${app.avatar.cleanup-delay-ms:60000}", fixedDelayString = "${app.avatar.cleanup-delay-ms:60000}")
    public void drain() {
        transactions.executeWithoutResult(status -> {
            for (ProfileImageCleanup job : queue.findTop20ByOrderByCreatedAtAsc()) {
                String id = job.getPublicId();
                if (!ProfileImageService.ownsAsset(id)) { log.warn("Rejected an invalid avatar cleanup reference."); continue; }
                if (users.existsByProfileImagePublicId(id)) continue;
                try { storage.deleteImage(id); queue.delete(job); }
                catch (RuntimeException ex) {
                    job.attempted(); queue.save(job);
                    log.warn("Avatar remote cleanup failed; retained for retry.");
                }
            }
        });
    }
}
