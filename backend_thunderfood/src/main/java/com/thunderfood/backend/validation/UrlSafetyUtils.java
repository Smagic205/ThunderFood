package com.thunderfood.backend.validation;

import java.net.URI;
import java.util.Locale;

/**
 * Utility to reject unsafe URL schemes (such as javascript:, vbscript:, data:) against XSS injection.
 */
public final class UrlSafetyUtils {

    private UrlSafetyUtils() {
    }

    public static boolean isSafeUrl(String rawUrl, boolean allowRelative) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return true;
        }

        for (int i = 0; i < rawUrl.length(); i++) {
            char c = rawUrl.charAt(i);
            if (c < 0x20 || c == 0x7F) {
                return false;
            }
        }

        String trimmed = rawUrl.trim();
        if (trimmed.startsWith("//")) {
            return false;
        }

        if (allowRelative && (trimmed.startsWith("/") || trimmed.startsWith("#"))) {
            return true;
        }

        try {
            URI uri = URI.create(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null) {
                return false;
            }
            String lowerScheme = scheme.toLowerCase(Locale.ROOT);
            if (!"http".equals(lowerScheme) && !"https".equals(lowerScheme)) {
                return false;
            }
            return uri.getHost() != null && !uri.getHost().isBlank();
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
