package com.thunderfood.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SafeUrlValidator implements ConstraintValidator<SafeUrl, String> {

    private boolean allowRelative;

    @Override
    public void initialize(SafeUrl constraintAnnotation) {
        this.allowRelative = constraintAnnotation.allowRelative();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return UrlSafetyUtils.isSafeUrl(value, allowRelative);
    }
}
