package com.thunderfood.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    public ImageUploadResponse uploadImage(MultipartFile file, String folder) {
        validateFile(file);

        try {
            String targetFolder = (folder != null && !folder.isBlank()) ? folder : "thunderfood/products";
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", targetFolder,
                            "resource_type", "image"
                    )
            );

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            return ImageUploadResponse.builder()
                    .imageUrl(secureUrl)
                    .publicId(publicId)
                    .originalFilename(file.getOriginalFilename())
                    .build();
        } catch (IOException e) {
            log.error("Lỗi khi tải ảnh lên Cloudinary: ", e);
            throw new RuntimeException("Không thể tải ảnh lên hệ thống lưu trữ: " + e.getMessage(), e);
        }
    }

    public List<ImageUploadResponse> uploadImages(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 tệp ảnh để tải lên");
        }

        List<ImageUploadResponse> results = new ArrayList<>();
        for (MultipartFile file : files) {
            results.add(uploadImage(file, folder));
        }
        return results;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được rỗng");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Dung lượng tệp không được vượt quá 5MB: " + file.getOriginalFilename());
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP, GIF: " + file.getOriginalFilename());
        }
    }
}
