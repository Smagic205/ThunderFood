package com.thunderfood.backend.exception;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import jakarta.validation.Valid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import static org.hamcrest.Matchers.hasValue;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    @Constraint(validatedBy = AlwaysFailObjectValidator.class)
    @interface ClassLevelConstraint {
        String message() default "Lỗi ràng buộc tổng thể";
        Class<?>[] groups() default {};
        Class<? extends Payload>[] payload() default {};
    }

    public static class AlwaysFailObjectValidator implements ConstraintValidator<ClassLevelConstraint, DummyBody> {
        @Override
        public boolean isValid(DummyBody value, ConstraintValidatorContext context) {
            return false;
        }
    }

    @ClassLevelConstraint
    public static class DummyBody {
        public String name;
    }

    @RestController
    static class DummyThrowingController {
        @GetMapping("/test/runtime")
        public void throwRuntime() {
            throw new RuntimeException("SQL error near table users_secret_col");
        }

        @GetMapping("/test/illegal-state")
        public void throwIllegalState() {
            throw new IllegalStateException("Đơn hàng đã được xác nhận");
        }

        @PostMapping("/test/class-validation")
        public void validateClassLevel(@Valid @RequestBody DummyBody body) {
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DummyThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("RuntimeException nội bộ trả về 500 với thông báo chung, không rò rỉ chi tiết kỹ thuật")
    void runtimeExceptionReturns500WithoutInternalLeak() throws Exception {
        mockMvc.perform(get("/test/runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", not(containsString("users_secret_col"))));
    }

    @Test
    @DisplayName("IllegalStateException nghiệp vụ vẫn trả về 400 với thông báo hợp lệ")
    void illegalStateExceptionReturns400() throws Exception {
        mockMvc.perform(get("/test/illegal-state"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Đơn hàng đã được xác nhận")));
    }

    @Test
    @DisplayName("MethodArgumentNotValidException với ObjectError cấp class không gây ClassCastException")
    void objectErrorDoesNotThrowClassCastException() throws Exception {
        mockMvc.perform(post("/test/class-validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"test\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.data", hasValue("Lỗi ràng buộc tổng thể")));
    }
}
