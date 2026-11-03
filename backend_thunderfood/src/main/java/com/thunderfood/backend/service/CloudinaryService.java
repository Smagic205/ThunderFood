package com.thunderfood.backend.service;

import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CloudinaryService {

    ImageUploadResponse uploadImage(MultipartFile file, String folder);

    List<ImageUploadResponse> uploadImages(List<MultipartFile> files, String folder);
}
