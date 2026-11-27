package com.thunderfood.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = SafeUrlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeUrl {

    String message() default "URL không hợp lệ hoặc sử dụng giao thức không an toàn";

    boolean allowRelative() default true;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
