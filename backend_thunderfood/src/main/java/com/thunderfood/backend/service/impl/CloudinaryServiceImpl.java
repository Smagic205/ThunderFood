package com.thunderfood.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.thunderfood.backend.dto.upload.ImageUploadResponse;
import com.thunderfood.backend.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_FILES_PER_BATCH = 10;
    private static final String DEFAULT_FOLDER = "thunderfood/products";
    private static final Pattern SAFE_FOLDER_PATTERN = Pattern.compile("^thunderfood(/[a-zA-Z0-9_-]+)*$");

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    @Override
    public ImageUploadResponse uploadImage(MultipartFile file, String folder) {
        byte[] fileBytes = validateAndReadFile(file);
        String targetFolder = sanitizeAndValidateFolder(folder);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    fileBytes,
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
            throw new RuntimeException("Không thể tải ảnh lên hệ thống lưu trữ", e);
        }
    }

    @Override
    public List<ImageUploadResponse> uploadImages(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 tệp ảnh để tải lên");
        }
        if (files.size() > MAX_FILES_PER_BATCH) {
            throw new IllegalArgumentException("Chỉ được tải lên tối đa " + MAX_FILES_PER_BATCH + " ảnh mỗi lần");
        }

        String targetFolder = sanitizeAndValidateFolder(folder);
        List<ImageUploadResponse> results = new ArrayList<>();
        for (MultipartFile file : files) {
            results.add(uploadImage(file, targetFolder));
        }
        return results;
    }

    private String sanitizeAndValidateFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return DEFAULT_FOLDER;
        }
        String clean = folder.trim();
        if (clean.contains("..") || clean.contains("\\") || !SAFE_FOLDER_PATTERN.matcher(clean).matches()) {
            throw new IllegalArgumentException("Thư mục lưu trữ ảnh không hợp lệ");
        }
        return clean;
    }

    private byte[] validateAndReadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được rỗng");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Dung lượng tệp không được vượt quá 5MB: " + file.getOriginalFilename());
        }

        String contentType = file.getContentType();
        String normalizedType = contentType != null ? contentType.trim().toLowerCase(Locale.ROOT) : "";
        if (!ALLOWED_CONTENT_TYPES.contains(normalizedType)) {
            throw new IllegalArgumentException("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP, GIF: " + file.getOriginalFilename());
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Không thể đọc dữ liệu tệp ảnh tải lên", e);
        }

        if (!matchesImageMagicBytes(normalizedType, bytes)) {
            throw new IllegalArgumentException("Nội dung tệp không khớp với định dạng ảnh hợp lệ: " + file.getOriginalFilename());
        }
        return bytes;
    }

    private boolean matchesImageMagicBytes(String contentType, byte[] bytes) {
        if (bytes == null) {
            return false;
        }
        return switch (contentType) {
            case "image/jpeg" -> bytes.length >= 3
                    && (bytes[0] & 0xFF) == 0xFF
                    && (bytes[1] & 0xFF) == 0xD8
                    && (bytes[2] & 0xFF) == 0xFF;
            case "image/png" -> bytes.length >= 8
                    && (bytes[0] & 0xFF) == 0x89
                    && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                    && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
            case "image/gif" -> {
                if (bytes.length < 6) yield false;
                String header = new String(bytes, 0, 6, StandardCharsets.US_ASCII);
                yield "GIF87a".equals(header) || "GIF89a".equals(header);
            }
            case "image/webp" -> bytes.length >= 12
                    && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
            default -> false;
        };
    }
}
