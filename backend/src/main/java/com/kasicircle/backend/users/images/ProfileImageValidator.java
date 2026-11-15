package com.kasicircle.backend.users.images;

import com.kasicircle.backend.businesses.exception.InvalidImageException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.Locale;
import java.util.Map;

@Component
public class ProfileImageValidator {
    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Map<String, String> TYPES = Map.of("jpeg", "image/jpeg", "png", "image/png", "webp", "image/webp");

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new InvalidImageException("Choose an image to upload.");
        if (file.getSize() > MAX_BYTES) throw new InvalidImageException("Profile pictures must be 5 MB or smaller.");
        if (file.getContentType() == null || !TYPES.containsValue(file.getContentType())) throw new InvalidImageException("Choose a JPEG, PNG or WebP image.");
        byte[] content;
        try { content = file.getBytes(); }
        catch (IOException ex) { throw new InvalidImageException("The image could not be read."); }
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(content))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new InvalidImageException("The file is not a valid image.");
            ImageReader reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!TYPES.containsKey(format) || !TYPES.get(format).equals(file.getContentType())) {
                    throw new InvalidImageException("The image content does not match its file type.");
                }
                validateFraming(format, content);
                AtomicBoolean warning = new AtomicBoolean();
                reader.addIIOReadWarningListener((source, message) -> warning.set(true));
                reader.setInput(input, false, false);
                // Bound decoded memory before reading pixels, even for compressed images under 5 MB.
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > 4096 || height > 4096 || (long) width * height > 16_000_000) {
                    throw new InvalidImageException("Choose an image no larger than 4096 pixels per side and 16 megapixels.");
                }
                if (reader.read(0) == null || warning.get()) throw new InvalidImageException("The image could not be decoded.");
            } finally { reader.dispose(); }
        } catch (InvalidImageException ex) {
            throw ex;
        } catch (IOException | RuntimeException ex) {
            throw new InvalidImageException("The image is malformed or cannot be decoded.");
        }
    }

    private void validateFraming(String format, byte[] bytes) {
        boolean valid = switch (format) {
            case "jpeg" -> bytes.length >= 4 && (bytes[bytes.length - 2] & 255) == 255 && (bytes[bytes.length - 1] & 255) == 217;
            case "png" -> bytes.length >= 12 && Arrays.equals(Arrays.copyOfRange(bytes, bytes.length - 12, bytes.length),
                    new byte[]{0, 0, 0, 0, 73, 69, 78, 68, (byte)174, 66, 96, (byte)130});
            case "webp" -> bytes.length >= 12 && Integer.toUnsignedLong(java.nio.ByteBuffer.wrap(bytes, 4, 4)
                    .order(java.nio.ByteOrder.LITTLE_ENDIAN).getInt()) == bytes.length - 8L;
            default -> false;
        };
        if (!valid) throw new InvalidImageException("The image is truncated or malformed.");
    }
}
