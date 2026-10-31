package com.thunderfood.backend.controller;

import com.thunderfood.backend.dto.ApiResponse;
import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import com.thunderfood.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/upload")
@RequiredArgsConstructor
public class AdminUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<ImageUploadResponse>>> uploadImages(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "folder", required = false, defaultValue = "thunderfood/products") String folder
    ) {
        List<ImageUploadResponse> responses = cloudinaryService.uploadImages(files, folder);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh lên thành công", responses));
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadSingleImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "thunderfood/products") String folder
    ) {
        ImageUploadResponse response = cloudinaryService.uploadImage(file, folder);
        return ResponseEntity.ok(ApiResponse.success("Tải ảnh lên thành công", response));
    }
}
