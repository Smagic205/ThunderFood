package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import com.thunderfood.backend.exception.GlobalExceptionHandler;
import com.thunderfood.backend.service.CloudinaryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminUploadControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private AdminUploadController adminUploadController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminUploadController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/admin/upload/images tải lên nhiều ảnh thành công")
    void testUploadImagesSuccess() throws Exception {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", "img1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.jpg", "image/jpeg", "img2".getBytes());

        List<ImageUploadResponse> responses = List.of(
                ImageUploadResponse.builder().imageUrl("https://res.cloudinary.com/url1").publicId("p1").originalFilename("img1.png").build(),
                ImageUploadResponse.builder().imageUrl("https://res.cloudinary.com/url2").publicId("p2").originalFilename("img2.jpg").build()
        );

        when(cloudinaryService.uploadImages(any(), anyString())).thenReturn(responses);

        mockMvc.perform(multipart("/api/v1/admin/upload/images")
                        .file(file1)
                        .file(file2)
                        .param("folder", "thunderfood/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].imageUrl", is("https://res.cloudinary.com/url1")));
    }

    @Test
    @DisplayName("POST /api/v1/admin/upload/image tải lên 1 ảnh thành công")
    void testUploadSingleImageSuccess() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "thumb.png", "image/png", "thumb".getBytes());

        ImageUploadResponse response = ImageUploadResponse.builder()
                .imageUrl("https://res.cloudinary.com/thumb")
                .publicId("thumb_1")
                .originalFilename("thumb.png")
                .build();

        when(cloudinaryService.uploadImage(any(), anyString())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/admin/upload/image")
                        .file(file)
                        .param("folder", "thunderfood/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.imageUrl", is("https://res.cloudinary.com/thumb")));
    }
}
