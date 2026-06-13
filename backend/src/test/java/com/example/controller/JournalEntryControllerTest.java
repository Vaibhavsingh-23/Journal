package com.example.controller;

import com.example.dto.JournalEntryDTO;
import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.exception.GlobalExceptionHandler;
import com.example.mapper.JournalEntryMapper;
import com.example.service.JournalEntryService;
import com.example.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for JournalEntryController using standalone MockMvc.
 * No Spring context or MongoDB needed.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JournalEntryController Tests")
class JournalEntryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private JournalEntryService journalEntryService;
    @Mock private UserService userService;

    private User testUser;
    private ObjectId userId;
    private ObjectId entryId;
    private JournalEntryMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new JournalEntryMapper();
        JournalEntryController controller = new JournalEntryController(journalEntryService, userService);
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        userId = new ObjectId();
        entryId = new ObjectId();

        testUser = new User();
        testUser.setId(userId);
        testUser.setUserName("testuser");
        testUser.setJournalEntryIds(new ArrayList<>(List.of(entryId)));
    }

    /** Helper to create an authenticated principal */
    private UsernamePasswordAuthenticationToken principal() {
        org.springframework.security.core.userdetails.User ud =
                new org.springframework.security.core.userdetails.User(
                        "testuser", "", List.of());
        return new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
    }

    @Test
    @DisplayName("GET /journal - returns paginated entries for authenticated user")
    void getAll_authenticated_returns200() throws Exception {
        JournalEntryDTO dto = new JournalEntryDTO();
        dto.setId(entryId.toHexString());
        dto.setTitle("Test Entry");
        dto.setDate(LocalDateTime.now());

        when(userService.findByUserName("testuser")).thenReturn(testUser);
        when(journalEntryService.getEntriesForUser(eq(userId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/journal").principal(principal()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].title").value("Test Entry"));
    }

    @Test
    @DisplayName("POST /journal - creates an entry and returns 201")
    void createEntry_valid_returns201() throws Exception {
        JournalEntry saved = new JournalEntry("New Entry");
        saved.setId(entryId);
        saved.setUserId(userId);
        saved.setDate(LocalDateTime.now());
        saved.setAnalysisCompleted(true);
        saved.setMood("Happy");

        JournalEntryDTO dto = mapper.toDTO(saved);

        when(journalEntryService.saveEntry(any(), eq("testuser"))).thenReturn(saved);
        when(journalEntryService.toDTO(saved)).thenReturn(dto);

        String body = "{\"title\":\"New Entry\",\"content\":\"Today was great!\"}";

        mockMvc.perform(post("/journal")
                        .principal(principal())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Entry"));
    }

    @Test
    @DisplayName("POST /journal - blank title returns 400")
    void createEntry_blankTitle_returns400() throws Exception {
        String body = "{\"title\":\"\",\"content\":\"Some content\"}";

        mockMvc.perform(post("/journal")
                        .principal(principal())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /journal/id/{id} - owned entry returns 200")
    void getById_ownedEntry_returns200() throws Exception {
        JournalEntry entry = new JournalEntry("My Entry");
        entry.setId(entryId);
        entry.setDate(LocalDateTime.now());
        entry.setAnalysisCompleted(false);

        JournalEntryDTO dto = mapper.toDTO(entry);

        when(userService.findByUserName("testuser")).thenReturn(testUser);
        when(journalEntryService.findById(entryId)).thenReturn(Optional.of(entry));
        when(journalEntryService.toDTO(entry)).thenReturn(dto);

        mockMvc.perform(get("/journal/id/" + entryId.toHexString()).principal(principal()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My Entry"));
    }

    @Test
    @DisplayName("GET /journal/id/{id} - not owned entry returns 404")
    void getById_notOwned_returns404() throws Exception {
        // User's entry list is empty (doesn't own this entryId)
        testUser.setJournalEntryIds(new ArrayList<>());

        when(userService.findByUserName("testuser")).thenReturn(testUser);

        mockMvc.perform(get("/journal/id/" + entryId.toHexString()).principal(principal()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /journal/id/{id} - owned entry update returns 200")
    void updateEntry_owned_returns200() throws Exception {
        JournalEntry updated = new JournalEntry("Updated");
        updated.setId(entryId);
        updated.setDate(LocalDateTime.now());
        updated.setAnalysisCompleted(true);

        JournalEntryDTO dto = mapper.toDTO(updated);

        when(userService.findByUserName("testuser")).thenReturn(testUser);
        when(journalEntryService.updateEntry(any(), any(), any())).thenReturn(updated);
        when(journalEntryService.toDTO(updated)).thenReturn(dto);

        String body = "{\"title\":\"Updated\",\"content\":\"New content\"}";

        mockMvc.perform(put("/journal/id/" + entryId.toHexString())
                        .principal(principal())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated"));
    }

    @Test
    @DisplayName("DELETE /journal/id/{id} - owned entry returns 204")
    void deleteEntry_owned_returns204() throws Exception {
        doNothing().when(journalEntryService).deleteById(any(), eq("testuser"));

        mockMvc.perform(delete("/journal/id/" + entryId.toHexString()).principal(principal()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /journal/id/{id} - not found returns 404")
    void deleteEntry_notFound_returns404() throws Exception {
        doThrow(new RuntimeException("Entry not found or access denied"))
                .when(journalEntryService).deleteById(any(), eq("testuser"));

        mockMvc.perform(delete("/journal/id/" + entryId.toHexString()).principal(principal()))
                .andExpect(status().isNotFound());
    }
}
