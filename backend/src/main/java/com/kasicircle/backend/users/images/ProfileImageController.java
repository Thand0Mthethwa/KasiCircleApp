package com.kasicircle.backend.users.images;

import com.kasicircle.backend.users.dto.UserProfileResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/me/profile-image")
public class ProfileImageController {
    private final ProfileImageService images;
    public ProfileImageController(ProfileImageService images) { this.images = images; }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileResponse upload(@RequestParam("file") MultipartFile file) { return images.upload(file); }
    @DeleteMapping
    public UserProfileResponse remove() { return images.remove(); }
}
