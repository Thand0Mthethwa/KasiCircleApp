package com.kasicircle.backend.businesses.validation;

import com.kasicircle.backend.businesses.exception.InvalidImageException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;

@Component
public class ImageValidator {

    public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };
    private static final byte[] RIFF_MAGIC = new byte[]{0x52, 0x49, 0x46, 0x46}; // "RIFF"
    private static final byte[] WEBP_MAGIC = new byte[]{0x57, 0x45, 0x42, 0x50}; // "WEBP"

    public record ValidatedImage(
            String contentType,
            String sanitizedFileName,
            long fileSize
    ) {}

    /**
     * Validates the uploaded file for size, format, signatures, and decode integrity.
     *
     * @param file The multipart file uploaded.
     * @return ValidatedImage metadata containing detected MIME type and sanitized name.
     */
    public ValidatedImage validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("Image file cannot be empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidImageException("Image file size exceeds the 5MB limit.");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new InvalidImageException("Failed to read image content: " + ex.getMessage());
        }

        if (bytes == null || bytes.length == 0) {
            throw new InvalidImageException("Image file cannot be empty.");
        }

        String detectedContentType = detectAndVerifyFormat(bytes);

        // Additional decode integrity check for JPEG and PNG
        if ("image/jpeg".equals(detectedContentType) || "image/png".equals(detectedContentType)) {
            try {
                BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
                if (img == null || img.getWidth() <= 0 || img.getHeight() <= 0) {
                    throw new InvalidImageException("Image content is corrupted or cannot be decoded.");
                }
            } catch (IOException ex) {
                throw new InvalidImageException("Corrupted image data: " + ex.getMessage());
            }
        }

        String sanitizedFileName = sanitizeFileName(file.getOriginalFilename(), detectedContentType);

        return new ValidatedImage(detectedContentType, sanitizedFileName, file.getSize());
    }

    private String detectAndVerifyFormat(byte[] bytes) {
        if (hasPrefix(bytes, JPEG_MAGIC)) {
            return "image/jpeg";
        }

        if (hasPrefix(bytes, PNG_MAGIC)) {
            return "image/png";
        }

        if (isWebP(bytes)) {
            return "image/webp";
        }

        throw new InvalidImageException(
                "Unsupported image format. Allowed formats are JPEG, PNG, and WebP."
        );
    }

    private boolean isWebP(byte[] bytes) {
        if (bytes.length < 30) {
            return false;
        }

        // Bytes 0-3 must be "RIFF"
        if (!Arrays.equals(Arrays.copyOfRange(bytes, 0, 4), RIFF_MAGIC)) {
            return false;
        }

        // Bytes 8-11 must be "WEBP"
        if (!Arrays.equals(Arrays.copyOfRange(bytes, 8, 12), WEBP_MAGIC)) {
            return false;
        }

        // Bytes 12-15 must start with "VP8 " or "VP8L" or "VP8X"
        String vp8Chunk = new String(bytes, 12, 4);
        return vp8Chunk.startsWith("VP8");
    }

    private boolean hasPrefix(byte[] data, byte[] prefix) {
        if (data == null || prefix == null || data.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private String sanitizeFileName(String originalFilename, String contentType) {
        String defaultExt = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };

        if (originalFilename == null || originalFilename.isBlank()) {
            return "image" + defaultExt;
        }

        // Strip path traversal characters
        String clean = originalFilename.replaceAll(".*[/\\\\]", "").trim();

        // Keep alphanumeric, dots, dashes, underscores
        clean = clean.replaceAll("[^a-zA-Z0-9._-]", "_");

        if (clean.isBlank() || clean.startsWith(".")) {
            clean = "image" + defaultExt;
        }

        if (clean.length() > 100) {
            clean = clean.substring(0, 100);
        }

        return clean;
    }
}

