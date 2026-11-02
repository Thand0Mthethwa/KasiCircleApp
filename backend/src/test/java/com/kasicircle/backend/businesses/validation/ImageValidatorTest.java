package com.kasicircle.backend.businesses.validation;

import com.kasicircle.backend.businesses.exception.InvalidImageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class ImageValidatorTest {

    private ImageValidator imageValidator;

    @BeforeEach
    void setUp() {
        imageValidator = new ImageValidator();
    }

    private byte[] createTestImageBytes(String format) throws IOException {
        BufferedImage img = new BufferedImage(50, 50, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.RED);
        g.fillRect(0, 0, 50, 50);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, format, baos);
        return baos.toByteArray();
    }

    private byte[] createTestWebpBytes() {
        byte[] bytes = new byte[36];
        // RIFF
        bytes[0] = 'R'; bytes[1] = 'I'; bytes[2] = 'F'; bytes[3] = 'F';
        // Size
        bytes[4] = 28; bytes[5] = 0; bytes[6] = 0; bytes[7] = 0;
        // WEBP
        bytes[8] = 'W'; bytes[9] = 'E'; bytes[10] = 'B'; bytes[11] = 'P';
        // VP8_
        bytes[12] = 'V'; bytes[13] = 'P'; bytes[14] = '8'; bytes[15] = ' ';
        return bytes;
    }

    @Test
    void validate_validJpeg_shouldPass() throws IOException {
        byte[] jpegBytes = createTestImageBytes("jpg");
        MockMultipartFile file = new MockMultipartFile(
                "file", "store_front.jpg", "image/jpeg", jpegBytes
        );

        ImageValidator.ValidatedImage result = imageValidator.validate(file);

        assertNotNull(result);
        assertEquals("image/jpeg", result.contentType());
        assertEquals("store_front.jpg", result.sanitizedFileName());
        assertEquals(jpegBytes.length, result.fileSize());
    }

    @Test
    void validate_validPng_shouldPass() throws IOException {
        byte[] pngBytes = createTestImageBytes("png");
        MockMultipartFile file = new MockMultipartFile(
                "file", "logo.png", "image/png", pngBytes
        );

        ImageValidator.ValidatedImage result = imageValidator.validate(file);

        assertNotNull(result);
        assertEquals("image/png", result.contentType());
        assertEquals("logo.png", result.sanitizedFileName());
        assertEquals(pngBytes.length, result.fileSize());
    }

    @Test
    void validate_validWebp_shouldPass() {
        byte[] webpBytes = createTestWebpBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "banner.webp", "image/webp", webpBytes
        );

        ImageValidator.ValidatedImage result = imageValidator.validate(file);

        assertNotNull(result);
        assertEquals("image/webp", result.contentType());
        assertEquals("banner.webp", result.sanitizedFileName());
        assertEquals(webpBytes.length, result.fileSize());
    }

    @Test
    void validate_emptyFile_shouldThrowException() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.jpg", "image/jpeg", new byte[0]
        );

        InvalidImageException ex = assertThrows(InvalidImageException.class,
                () -> imageValidator.validate(emptyFile));
        assertEquals("Image file cannot be empty.", ex.getMessage());
    }

    @Test
    void validate_fileExceeding5MB_shouldThrowException() {
        byte[] largeBytes = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file", "large.jpg", "image/jpeg", largeBytes
        );

        InvalidImageException ex = assertThrows(InvalidImageException.class,
                () -> imageValidator.validate(largeFile));
        assertEquals("Image file size exceeds the 5MB limit.", ex.getMessage());
    }

    @Test
    void validate_unsupportedSvg_shouldThrowException() {
        byte[] svgBytes = "<svg xmlns='http://www.w3.org/2000/svg'><circle r='10'/></svg>"
                .getBytes(StandardCharsets.UTF_8);
        MockMultipartFile svgFile = new MockMultipartFile(
                "file", "graphic.svg", "image/svg+xml", svgBytes
        );

        InvalidImageException ex = assertThrows(InvalidImageException.class,
                () -> imageValidator.validate(svgFile));
        assertTrue(ex.getMessage().contains("Unsupported image format"));
    }

    @Test
    void validate_unsupportedGif_shouldThrowException() {
        byte[] gifBytes = "GIF89a".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile gifFile = new MockMultipartFile(
                "file", "anim.gif", "image/gif", gifBytes
        );

        InvalidImageException ex = assertThrows(InvalidImageException.class,
                () -> imageValidator.validate(gifFile));
        assertTrue(ex.getMessage().contains("Unsupported image format"));
    }

    @Test
    void validate_corruptedImageData_shouldThrowException() {
        // Starts with JPEG magic bytes (FF D8 FF) followed by invalid garbage
        byte[] corruptBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x01, 0x02};
        MockMultipartFile corruptFile = new MockMultipartFile(
                "file", "corrupt.jpg", "image/jpeg", corruptBytes
        );

        InvalidImageException ex = assertThrows(InvalidImageException.class,
                () -> imageValidator.validate(corruptFile));
        String message = ex.getMessage().toLowerCase();
        assertTrue(message.contains("corrupted") || message.contains("cannot be decoded"));
    }

    @Test
    void validate_filenameSanitization_shouldRemovePathTraversalAndSpecialChars() throws IOException {
        byte[] jpegBytes = createTestImageBytes("jpg");
        MockMultipartFile fileWithTraversal = new MockMultipartFile(
                "file", "../../etc/passwd/image!@#.jpg", "image/jpeg", jpegBytes
        );

        ImageValidator.ValidatedImage result = imageValidator.validate(fileWithTraversal);

        assertNotNull(result);
        assertEquals("image___.jpg", result.sanitizedFileName());
        assertFalse(result.sanitizedFileName().contains("/"));
        assertFalse(result.sanitizedFileName().contains(".."));
    }
}

