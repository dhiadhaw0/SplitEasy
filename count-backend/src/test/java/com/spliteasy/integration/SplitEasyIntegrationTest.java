package com.spliteasy.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spliteasy.dto.request.ExpenseRequest;
import com.spliteasy.dto.request.GroupRequest;
import com.spliteasy.dto.request.ParticipantRequest;
import com.spliteasy.dto.request.RegisterRequest;
import com.spliteasy.dto.request.ShareRequest;
import com.spliteasy.dto.response.AuthResponse;
import com.spliteasy.dto.response.BalanceResponse;
import com.spliteasy.dto.response.GroupDetailResponse;
import com.spliteasy.dto.response.ParticipantResponse;
import com.spliteasy.entity.enums.Currency;
import com.spliteasy.entity.enums.SplitType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end tests exercising the real HTTP layer, security filter chain and database
 * (H2 in MySQL compatibility mode, see application-test.properties).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SplitEasyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final AtomicInteger EMAIL_SEQUENCE = new AtomicInteger();

    private String uniqueEmail(String prefix) {
        return prefix + EMAIL_SEQUENCE.incrementAndGet() + "@spliteasy-test.com";
    }

    private String registerAndGetToken(String displayName, String email) throws Exception {
        RegisterRequest request = new RegisterRequest(displayName, email, "password123");
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        AuthResponse auth = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
        return auth.token();
    }

    @Test
    void register_then_login_returns_a_valid_token() throws Exception {
        String email = uniqueEmail("alice");
        RegisterRequest register = new RegisterRequest("Alice", email, "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "password123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void login_with_wrong_password_returns_401() throws Exception {
        String email = uniqueEmail("bob");
        registerAndGetToken("Bob", email);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "wrong-password"}
                                """.formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void creating_a_group_makes_the_creator_its_first_participant() throws Exception {
        String token = registerAndGetToken("Chloé", uniqueEmail("chloe"));
        GroupRequest group = new GroupRequest("Voyage à Rome", "Été 2026", Currency.EUR);

        mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(group)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Voyage à Rome"))
                .andExpect(jsonPath("$.participants", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.myParticipantId").isNotEmpty())
                .andExpect(jsonPath("$.inviteCode").isNotEmpty());
    }

    @Test
    void a_non_member_gets_403_on_a_groups_endpoints() throws Exception {
        String ownerToken = registerAndGetToken("Dan", uniqueEmail("dan"));
        Long groupId = createGroup(ownerToken, "Colocation", Currency.EUR).id();

        String outsiderToken = registerAndGetToken("Eve", uniqueEmail("eve"));

        mockMvc.perform(get("/api/groups/" + groupId)
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void request_without_a_token_is_rejected_with_401() throws Exception {
        mockMvc.perform(get("/api/groups"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void creating_an_equal_expense_updates_both_participants_balances() throws Exception {
        String token = registerAndGetToken("Farid", uniqueEmail("farid"));
        GroupDetailResponse group = createGroup(token, "Weekend", Currency.EUR);
        Long groupId = group.id();
        Long farid = group.myParticipantId();

        // Add a second, unlinked participant ("Grandma" style).
        ParticipantRequest newParticipant = new ParticipantRequest("Grand-mère");
        MvcResult participantResult = mockMvc.perform(post("/api/groups/" + groupId + "/participants")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newParticipant)))
                .andExpect(status().isCreated())
                .andReturn();
        Long grandma = objectMapper.readValue(participantResult.getResponse().getContentAsString(), ParticipantResponse.class).id();

        ExpenseRequest expense = new ExpenseRequest(
                "Restaurant", new BigDecimal("100.00"), LocalDate.now(), null, farid, SplitType.EQUAL,
                List.of(new ShareRequest(farid, null), new ShareRequest(grandma, null)));

        mockMvc.perform(post("/api/groups/" + groupId + "/expenses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expense)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(100.00));

        MvcResult balancesResult = mockMvc.perform(get("/api/groups/" + groupId + "/balances")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        List<BalanceResponse> balances = objectMapper.readValue(
                balancesResult.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, BalanceResponse.class));

        BigDecimal faridBalance = balances.stream().filter(b -> b.participantId().equals(farid)).findFirst().orElseThrow().balance();
        BigDecimal grandmaBalance = balances.stream().filter(b -> b.participantId().equals(grandma)).findFirst().orElseThrow().balance();

        assertThat(faridBalance).isEqualByComparingTo("50.00");
        assertThat(grandmaBalance).isEqualByComparingTo("-50.00");
        assertThat(faridBalance.add(grandmaBalance)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void deleting_a_group_is_reserved_to_its_creator() throws Exception {
        String ownerToken = registerAndGetToken("Gina", uniqueEmail("gina"));
        Long groupId = createGroup(ownerToken, "Anniversaire", Currency.EUR).id();

        // A member who did not create the group cannot delete it; simulate with the invite flow.
        MvcResult inviteResult = mockMvc.perform(get("/api/groups/" + groupId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();
        String inviteCode = objectMapper.readValue(inviteResult.getResponse().getContentAsString(), GroupDetailResponse.class).inviteCode();

        String memberToken = registerAndGetToken("Hugo", uniqueEmail("hugo"));
        mockMvc.perform(post("/api/groups/join")
                        .header("Authorization", "Bearer " + memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"inviteCode": "%s", "newParticipantName": "Hugo"}
                                """.formatted(inviteCode)))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/groups/" + groupId)
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/groups/" + groupId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNoContent());
    }

    private GroupDetailResponse createGroup(String token, String name, Currency currency) throws Exception {
        GroupRequest request = new GroupRequest(name, null, currency);
        MvcResult result = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), GroupDetailResponse.class);
    }
}
