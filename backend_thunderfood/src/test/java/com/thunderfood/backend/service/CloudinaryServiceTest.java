package com.thunderfood.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import com.thunderfood.backend.service.impl.CloudinaryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    private static final byte[] VALID_JPEG_BYTES = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
    private static final byte[] VALID_PNG_BYTES = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00};
    private static final byte[] VALID_WEBP_BYTES = "RIFF1234WEBP".getBytes(StandardCharsets.US_ASCII);

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryServiceImpl cloudinaryService;

    @BeforeEach
    void setUp() {
        lenient().when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Test
    @DisplayName("uploadImage thành công với file hợp lệ")
    void testUploadImageSuccess() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "food.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        Map<String, Object> uploadResult = Map.of(
                "secure_url", "https://res.cloudinary.com/demo/image/upload/food.jpg",
                "public_id", "thunderfood/products/food_123"
        );

        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(uploadResult);

        ImageUploadResponse response = cloudinaryService.uploadImage(file, "thunderfood/products");

        assertNotNull(response);
        assertEquals("https://res.cloudinary.com/demo/image/upload/food.jpg", response.getImageUrl());
        assertEquals("thunderfood/products/food_123", response.getPublicId());
        assertEquals("food.jpg", response.getOriginalFilename());
    }

    @Test
    @DisplayName("uploadImage ném ngoại lệ khi file rỗng")
    void testUploadImageEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> cloudinaryService.uploadImage(emptyFile, "thunderfood/products")
        );
        assertTrue(ex.getMessage().contains("không được rỗng"));
    }

    @Test
    @DisplayName("uploadImage ném ngoại lệ khi file vượt quá 5MB")
    void testUploadImageOversized() {
        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6MB
        MockMultipartFile oversizedFile = new MockMultipartFile(
                "file",
                "big.png",
                "image/png",
                largeBytes
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> cloudinaryService.uploadImage(oversizedFile, "thunderfood/products")
        );
        assertTrue(ex.getMessage().contains("vượt quá 5MB"));
    }

    @Test
    @DisplayName("uploadImage ném ngoại lệ khi định dạng không được hỗ trợ")
    void testUploadImageInvalidContentType() {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "dummy pdf content".getBytes(StandardCharsets.UTF_8)
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> cloudinaryService.uploadImage(pdfFile, "thunderfood/products")
        );
        assertTrue(ex.getMessage().contains("không được hỗ trợ"));
    }

    @Test
    @DisplayName("uploadImage từ chối file giả mạo Content-Type khi magic bytes không khớp")
    void testUploadImageSpoofedMagicBytes() {
        MockMultipartFile spoofed = new MockMultipartFile(
                "file",
                "fake.png",
                "image/png",
                "<?php echo 'hack'; ?>".getBytes(StandardCharsets.UTF_8)
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> cloudinaryService.uploadImage(spoofed, "thunderfood/products")
        );
        assertTrue(ex.getMessage().contains("không khớp"));
    }

    @Test
    @DisplayName("uploadImage từ chối tên thư mục nằm ngoài namespace thunderfood hoặc chứa path traversal")
    void testUploadImageInvalidFolder() {
        MockMultipartFile file = new MockMultipartFile("file", "ok.jpg", "image/jpeg", VALID_JPEG_BYTES);

        assertThrows(IllegalArgumentException.class, () -> cloudinaryService.uploadImage(file, "../secret"));
        assertThrows(IllegalArgumentException.class, () -> cloudinaryService.uploadImage(file, "external/bucket"));
    }

    @Test
    @DisplayName("uploadImages thành công với danh sách nhiều ảnh")
    void testUploadImagesSuccess() throws IOException {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", VALID_PNG_BYTES);
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.webp", "image/webp", VALID_WEBP_BYTES);

        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(Map.of("secure_url", "https://res.cloudinary.com/url1", "public_id", "p1"))
                .thenReturn(Map.of("secure_url", "https://res.cloudinary.com/url2", "public_id", "p2"));

        List<ImageUploadResponse> responses = cloudinaryService.uploadImages(List.of(file1, file2), "thunderfood/products");

        assertEquals(2, responses.size());
        assertEquals("https://res.cloudinary.com/url1", responses.get(0).getImageUrl());
        assertEquals("https://res.cloudinary.com/url2", responses.get(1).getImageUrl());
    }

    @Test
    @DisplayName("uploadImages từ chối khi vượt quá số lượng tối đa 10 ảnh mỗi lần")
    void testUploadImagesExceedsLimit() {
        List<MultipartFile> tooMany = IntStream.range(0, 11)
                .mapToObj(i -> (MultipartFile) new MockMultipartFile("files", "img" + i + ".jpg", "image/jpeg", VALID_JPEG_BYTES))
                .toList();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> cloudinaryService.uploadImages(tooMany, "thunderfood/products")
        );
        assertTrue(ex.getMessage().contains("tối đa 10 ảnh"));
    }
}
