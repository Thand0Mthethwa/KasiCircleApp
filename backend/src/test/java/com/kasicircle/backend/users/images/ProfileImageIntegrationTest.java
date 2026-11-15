package com.kasicircle.backend.users.images;

import com.kasicircle.backend.businesses.storage.ImageStorageService;
import com.kasicircle.backend.businesses.storage.ImageUploadResult;
import com.kasicircle.backend.businesses.storage.StorageException;
import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.entity.User;
import com.kasicircle.backend.users.repository.UserRepository;
import com.kasicircle.backend.workers.repository.WorkerProfileRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:avatar-integration;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProfileImageIntegrationTest {
    static final String EMAIL = "avatar@example.test";
    static final String ENDPOINT = "/api/users/me/profile-image";
    @Autowired MockMvc mvc;
    @Autowired ProfileImageService images;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean UserRepository users;
    @Autowired WorkerProfileRepository workers;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean ProfileImageCleanupRepository queue;
    @Autowired TransactionTemplate transactions;
    @MockitoBean ImageStorageService storage;
    String newId;
    @BeforeEach void setup() {
        workers.deleteAll(); queue.deleteAll(); users.deleteAll();
        users.saveAndFlush(User.builder().email(EMAIL).firstName("Avatar").lastName("Member").password("unused-test-hash").build());
        newId = assetId();
        when(storage.uploadImage(any(), eq(ProfileImageService.FOLDER))).thenReturn(new ImageUploadResult("https://images.example.test/new.png", newId));
    }
    static String assetId() { return ProfileImageService.FOLDER + "/" + UUID.randomUUID(); }
    static byte[] image(String format) throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB), format, output);
        return output.toByteArray();
    }
    static MockMultipartFile png() throws Exception { return new MockMultipartFile("file", "../../ignored.png", "image/png", image("png")); }
    void oldPicture(String id) {
        var user = users.findByEmail(EMAIL).orElseThrow();user.setProfileImageUrl("https://images.example.test/old.png");user.setProfileImagePublicId(id);users.saveAndFlush(user);
    }
    ProfileImageCleanupWorker cleanupWorker() { return new ProfileImageCleanupWorker(queue, users, storage, transactions); }

    @ParameterizedTest @EnumSource(AccountType.class) @WithMockUser(username=EMAIL)
    void everyAccountTypeCanUploadItsOwnAvatar(AccountType type) throws Exception {
        var user = users.findByEmail(EMAIL).orElseThrow();user.setAccountType(type);users.saveAndFlush(user);
        var other = users.saveAndFlush(User.builder().email("other@example.test").firstName("Other").lastName("Member").password("unused").build());
        mvc.perform(multipart(ENDPOINT).file(png()).param("userId",other.getId().toString()).param("publicId","business-images/do-not-delete"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.profileImageUrl").value("https://images.example.test/new.png"))
                .andExpect(jsonPath("$.accountType").value(type.name())).andExpect(jsonPath("$.profileImagePublicId").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
        assertEquals(newId, users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());
        assertNull(users.findById(other.getId()).orElseThrow().getProfileImageUrl());
        mvc.perform(get("/api/users/me")).andExpect(jsonPath("$.profileImageUrl").value("https://images.example.test/new.png"));
        verify(storage).uploadImage(any(),eq(ProfileImageService.FOLDER));
    }
    @Test @WithMockUser(username=EMAIL) void usersWithoutPicturesRemainCompatible() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isOk()).andExpect(jsonPath("$.profileImageUrl").isEmpty());
        mvc.perform(delete(ENDPOINT)).andExpect(status().isOk()).andExpect(jsonPath("$.profileImageUrl").isEmpty());
        verifyNoInteractions(storage);
    }
    @Test void unauthenticatedUploadIsRejected() throws Exception { mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isUnauthorized());verifyNoInteractions(storage); }
    @Test void unauthenticatedRemovalIsRejected() throws Exception { mvc.perform(delete(ENDPOINT)).andExpect(status().isUnauthorized());verifyNoInteractions(storage); }
    @Test @WithMockUser(username=EMAIL) void malformedImageIsRejected() throws Exception {
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file","bad.png","image/png",new byte[]{1,2,3}))).andExpect(status().isBadRequest());verifyNoInteractions(storage);
    }
    @Test @WithMockUser(username=EMAIL) void unsupportedFormatAndMimeSpoofingAreRejected() throws Exception {
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file","bad.svg","image/svg+xml","<svg/>".getBytes()))).andExpect(status().isBadRequest());
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file","bad.jpg","image/jpeg",image("png")))).andExpect(status().isBadRequest());verifyNoInteractions(storage);
    }
    @Test @WithMockUser(username=EMAIL) void oversizedUploadIsRejected() throws Exception {
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file","large.png","image/png",new byte[5*1024*1024+1]))).andExpect(status().isBadRequest());verifyNoInteractions(storage);
    }
    @Test @WithMockUser(username=EMAIL) void absentOrEmptyFileIsRejected() throws Exception {
        mvc.perform(multipart(ENDPOINT)).andExpect(status().isBadRequest());
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file",new byte[0]))).andExpect(status().isBadRequest());verifyNoInteractions(storage);
    }
    @Test @WithMockUser(username=EMAIL) void jpegContentIsDecoded() throws Exception {
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file","image.jpg","image/jpeg",image("jpeg")))).andExpect(status().isOk());
    }
    @Test @WithMockUser(username=EMAIL) void replacementQueuesOldImageOnlyAfterPersistence() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isOk());
        assertEquals(newId,users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());
        assertEquals(oldId,queue.findAll().get(0).getPublicId());verify(storage,never()).deleteImage(anyString());
        cleanupWorker().drain();verify(storage).deleteImage(oldId);assertEquals(0,queue.count());
    }
    @Test @WithMockUser(username=EMAIL) void removalClearsDatabaseAndRetriesRemoteFailure() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        mvc.perform(delete(ENDPOINT)).andExpect(status().isOk()).andExpect(jsonPath("$.profileImageUrl").isEmpty());
        assertNull(users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());
        doThrow(new StorageException("provider detail must not escape")).when(storage).deleteImage(oldId);
        cleanupWorker().drain();assertEquals(1,queue.count());assertEquals(1,queue.findAll().get(0).getAttempts());
        doNothing().when(storage).deleteImage(oldId);cleanupWorker().drain();assertEquals(0,queue.count());
    }
    @Test @WithMockUser(username=EMAIL) void uploadFailurePreservesExistingPictureAndHidesProviderDetails() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        when(storage.uploadImage(any(),any())).thenThrow(new StorageException("sensitive-provider-detail"));
        mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("Profile picture storage is unavailable. Please try again later."));
        assertEquals(oldId,users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());assertEquals(0,queue.count());verify(storage,never()).deleteImage(anyString());
    }
    @Test void cleanupNeverDeletesBusinessAssetsOrActiveAvatars() {
        String activeId=assetId();oldPicture(activeId);
        queue.saveAndFlush(new ProfileImageCleanup("business-images/existing"));queue.saveAndFlush(new ProfileImageCleanup(activeId));
        cleanupWorker().drain();verifyNoInteractions(storage);assertEquals(2,queue.count());
    }
    @Test @WithMockUser(username=EMAIL) void webpContentIsDecoded() throws Exception {
        try (var resource = getClass().getResourceAsStream("/images/avatar.webp")) {
            assertNotNull(resource);
            mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file", "picture.webp", "image/webp", resource.readAllBytes())))
                    .andExpect(status().isOk());
        }
    }
    @Test @WithMockUser(username=EMAIL) void truncatedContentIsRejected() throws Exception {
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file","truncated.png","image/png",java.util.Arrays.copyOf(image("png"),25))))
                .andExpect(status().isBadRequest());verifyNoInteractions(storage);
    }
    @Test @WithMockUser(username=EMAIL) void decodedDimensionsAreBounded() throws Exception {
        var output=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(4097,1,BufferedImage.TYPE_INT_RGB),"png",output);
        mvc.perform(multipart(ENDPOINT).file(new MockMultipartFile("file","wide.png","image/png",output.toByteArray())))
                .andExpect(status().isBadRequest());verifyNoInteractions(storage);
    }
    @Test @WithMockUser(username=EMAIL) void databaseFailureCleansNewUploadAndRetainsOldPicture() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("simulated DB outage")).when(users).saveAndFlush(any(User.class));
        mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isInternalServerError());
        assertEquals(oldId,users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());
        verify(storage).deleteImage(newId);verify(storage,never()).deleteImage(oldId);assertEquals(0,queue.count());
    }
    @Test @WithMockUser(username=EMAIL) void transactionRollbackAfterFlushRestoresOldReference() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("outbox failure")).when(queue).save(any(ProfileImageCleanup.class));
        mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isInternalServerError());
        assertEquals(oldId,users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());
        verify(storage).deleteImage(newId);verify(storage,never()).deleteImage(oldId);
    }
    @Test @WithMockUser(username=EMAIL) void failedOrphanDeletionIsPersistentlyQueued() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("simulated DB outage")).when(users).saveAndFlush(any(User.class));
        doThrow(new StorageException("remote down")).when(storage).deleteImage(newId);
        mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isInternalServerError());
        assertEquals(newId,queue.findAll().get(0).getPublicId());
        doNothing().when(storage).deleteImage(newId);cleanupWorker().drain();assertEquals(0,queue.count());
        assertEquals(oldId,users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());
    }
    @Test @WithMockUser(username=EMAIL) void failedRemovalTransactionKeepsExistingPicture() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        doThrow(new org.springframework.dao.DataAccessResourceFailureException("outbox failure")).when(queue).save(any(ProfileImageCleanup.class));
        mvc.perform(delete(ENDPOINT)).andExpect(status().isInternalServerError());
        assertEquals(oldId,users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());verifyNoInteractions(storage);
    }
    @Test @WithMockUser(username=EMAIL) void unexpectedBusinessStorageIdIsNeverPersistedOrDeleted() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        when(storage.uploadImage(any(),any())).thenReturn(new ImageUploadResult("https://images.example.test/new.png","business-images/existing"));
        mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isServiceUnavailable());
        assertEquals(oldId,users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId());verify(storage,never()).deleteImage(anyString());
    }

    @Test @WithMockUser(username=EMAIL) void publicWorkerResponsesExposeOnlyTheAvatarUrl() throws Exception {
        var user=users.findByEmail(EMAIL).orElseThrow();user.setAccountType(AccountType.WORKER);users.saveAndFlush(user);
        mvc.perform(multipart(ENDPOINT).file(png())).andExpect(status().isOk());
        mvc.perform(post("/api/workers/me").contentType("application/json").content("""
                {"headline":"Local plumber","bio":"Public plumbing skills","skills":["Plumbing"],
                 "serviceCategories":["Repairs"],"city":"Soweto","province":"Gauteng"}
                """)).andExpect(status().isCreated());
        var profileId=workers.findAll().get(0).getId();
        mvc.perform(get("/api/workers/"+profileId).with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.profileImageUrl").value("https://images.example.test/new.png"))
                .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.phoneNumber").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist()).andExpect(jsonPath("$.profileImagePublicId").doesNotExist());
        mvc.perform(get("/api/workers").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].profileImageUrl").value("https://images.example.test/new.png"));
    }

    @Test void avatarPersistsAcrossRealJwtLoginSessions() throws Exception {
        var user=users.findByEmail(EMAIL).orElseThrow();
        user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("test-only-avatar-value"));
        users.saveAndFlush(user);
        String credentials="{\"email\":\""+EMAIL+"\",\"password\":\"test-only-avatar-value\"}";
        var mapper=new com.fasterxml.jackson.databind.ObjectMapper();
        String token=mapper.readTree(mvc.perform(post("/api/auth/login").contentType("application/json").content(credentials))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
        mvc.perform(multipart(ENDPOINT).file(png()).header("Authorization","Bearer "+token)).andExpect(status().isOk());
        String nextToken=mapper.readTree(mvc.perform(post("/api/auth/login").contentType("application/json").content(credentials))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get("/api/users/me").header("Authorization","Bearer "+nextToken)).andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("https://images.example.test/new.png"));
        mvc.perform(delete(ENDPOINT).header("Authorization","Bearer "+nextToken)).andExpect(status().isOk());
        mvc.perform(get("/api/users/me").header("Authorization","Bearer "+token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").isEmpty());
    }
    @Test void concurrentReplacementsNeverQueueTheWinningAvatarForDeletion() throws Exception {
        String oldId=assetId();oldPicture(oldId);
        var uploaded=new java.util.concurrent.ConcurrentLinkedQueue<String>();
        var ready=new java.util.concurrent.CountDownLatch(2);
        when(storage.uploadImage(any(),any())).thenAnswer(call->{
            String id=assetId();uploaded.add(id);ready.countDown();
            assertTrue(ready.await(10,java.util.concurrent.TimeUnit.SECONDS));
            return new ImageUploadResult("https://images.example.test/"+UUID.randomUUID()+".png",id);
        });
        var file=png();
        try(var executor=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var action=(java.util.concurrent.Callable<Void>)()->{
                var context=org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
                context.setAuthentication(org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(EMAIL,"unused",java.util.List.of()));
                org.springframework.security.core.context.SecurityContextHolder.setContext(context);
                try { images.upload(file);return null; }
                finally { org.springframework.security.core.context.SecurityContextHolder.clearContext(); }
            };
            var first=executor.submit(action);var second=executor.submit(action);
            first.get(20,java.util.concurrent.TimeUnit.SECONDS);second.get(20,java.util.concurrent.TimeUnit.SECONDS);
        }
        String winner=users.findByEmail(EMAIL).orElseThrow().getProfileImagePublicId();
        assertTrue(uploaded.contains(winner));assertEquals(2,queue.count());
        assertTrue(queue.findAll().stream().noneMatch(job->job.getPublicId().equals(winner)));
        cleanupWorker().drain();verify(storage,never()).deleteImage(winner);assertEquals(0,queue.count());
    }

}
