package com.thunderfood.backend.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.thunderfood.backend.dto.auth.LoginRequest;
import com.thunderfood.backend.entity.Role;
import com.thunderfood.backend.entity.User;
import com.thunderfood.backend.repository.*;
import com.thunderfood.backend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    protected final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    protected EmailService emailService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected RoleRepository roleRepository;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected UserTokenRepository userTokenRepository;

    @Autowired
    protected CategoryRepository categoryRepository;

    @Autowired
    protected ProductRepository productRepository;

    @Autowired
    protected ProductImageRepository productImageRepository;

    @Autowired
    protected CartRepository cartRepository;

    @Autowired
    protected CartItemRepository cartItemRepository;

    @Autowired
    protected ServiceWardRepository serviceWardRepository;

    @Autowired
    protected AddressRepository addressRepository;

    @Autowired
    protected VoucherRepository voucherRepository;

    @Autowired
    protected VoucherUsageRepository voucherUsageRepository;

    @Autowired
    protected DeliveryPackageRepository deliveryPackageRepository;

    @Autowired
    protected OrderRepository orderRepository;

    @Autowired
    protected OrderItemRepository orderItemRepository;

    @Autowired
    protected OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    protected NotificationRepository notificationRepository;

    @Autowired
    protected ReviewRepository reviewRepository;

    @Autowired
    protected WishlistRepository wishlistRepository;

    @Autowired
    protected BannerRepository bannerRepository;

    @BeforeEach
    void cleanDatabase() {
        notificationRepository.deleteAllInBatch();
        reviewRepository.deleteAllInBatch();
        wishlistRepository.deleteAllInBatch();
        orderStatusHistoryRepository.deleteAllInBatch();
        voucherUsageRepository.deleteAllInBatch();
        orderItemRepository.deleteAllInBatch();
        cartItemRepository.deleteAllInBatch();
        cartRepository.deleteAllInBatch();
        orderRepository.deleteAllInBatch();
        deliveryPackageRepository.deleteAllInBatch();
        addressRepository.deleteAllInBatch();
        serviceWardRepository.deleteAllInBatch();
        voucherRepository.deleteAllInBatch();
        productImageRepository.deleteAllInBatch();
        productRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
        bannerRepository.deleteAllInBatch();
        userTokenRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    protected User createUser(String email, String fullName, String rawPassword, String phone, String roleName, String status) {
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Role không tồn tại: " + roleName));

        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .phone(phone)
                .role(role)
                .authProvider("LOCAL")
                .status(status)
                .build();
        return userRepository.save(user);
    }

    protected String loginAndGetAccessToken(String email, String rawPassword) throws Exception {
        LoginRequest loginRequest = new LoginRequest(email, rawPassword);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("token").asText();
    }
}
