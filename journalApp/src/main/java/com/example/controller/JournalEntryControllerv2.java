package com.example.controller;

import com.example.dto.JournalEntryDTO;
import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.service.JournalEntryService;
import com.example.service.UserService;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/journal")
public class JournalEntryControllerv2 {

    @Autowired
    private JournalEntryService journalEntryService;

    @Autowired
    private UserService userService;

//    @GetMapping
//    public ResponseEntity<?> getAllJournalEntriesOfUser() {
//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        String userName = authentication.getName();
//        User user = userService.findByUserName(userName);
//        List<JournalEntry> all = user.getJournalEntries();
//        if(all!=null && !all.isEmpty()){
//            return new ResponseEntity<>(all,HttpStatus.OK);
//        }
//        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
//    }

    @GetMapping
    public ResponseEntity<?> getAllJournalEntriesOfUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userName = auth.getName();

        User user = userService.findByUserName(userName);

        List<JournalEntryDTO> dtoList = user.getJournalEntries()
                .stream()
                .map(journalEntryService::toDTO)
                .toList();

        return ResponseEntity.ok(dtoList);
    }


    @PostMapping
    public ResponseEntity<JournalEntry> createEntry(@RequestBody JournalEntry myEntry) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userName = authentication.getName();
            myEntry.setDate(LocalDateTime.now());

            journalEntryService.saveEntry(myEntry,userName);
            return new ResponseEntity<>(myEntry,HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

//    @GetMapping("/id/{myId}")
//    public ResponseEntity<JournalEntry> getJournalEntryById(@PathVariable String myId) {
//        try {
//            ObjectId objectId = new ObjectId(myId);
//
//            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//            String userName = authentication.getName();
//            User user = userService.findByUserName(userName);
//
//            boolean exists = user.getJournalEntries().stream()
//                    .anyMatch(entry -> entry.getId().equals(objectId));
//
//            if (exists) {
//                Optional<JournalEntry> journalEntry = journalEntryService.findById(objectId);
//                return journalEntry.map(ResponseEntity::ok)
//                        .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
//            }
//
//            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
//        } catch (IllegalArgumentException e) {
//            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
//        }
//    }


    @GetMapping("/id/{myId}")
    public ResponseEntity<?> getJournalEntryById(@PathVariable String myId) {
        try {
            ObjectId objectId = new ObjectId(myId);

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.findByUserName(auth.getName());

            boolean exists = user.getJournalEntries()
                    .stream()
                    .anyMatch(entry -> entry.getId().equals(objectId));

            if (!exists) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            return journalEntryService.findById(objectId)
                    .map(journalEntryService::toDTO)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid ID format");
        }
    }


    /**
     * Delete journal entry by ID
     * Accepts String ID and converts to ObjectId
     */
    @DeleteMapping("/id/{myId}")
    public ResponseEntity<?> deleteJournalEntryById(@PathVariable String myId) {
        try {
            ObjectId objectId = new ObjectId(myId);
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userName = authentication.getName();
            journalEntryService.deleteById(objectId, userName);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid ID format", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to delete entry", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update journal entry
     * FIXED: Changed from ObjectId to String parameter
     */
    @PutMapping("/id/{myId}")
    public ResponseEntity<?> updateJournalentry(@PathVariable String myId, @RequestBody JournalEntry newEntry) {
        try {
            ObjectId objectId = new ObjectId(myId);
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userName = authentication.getName();
            User user = userService.findByUserName(userName);

            List<JournalEntry> collect = user.getJournalEntries().stream()
                    .filter(x -> x.getId().equals(objectId))
                    .collect(Collectors.toList());

            if(!collect.isEmpty()){
                Optional<JournalEntry> journalEntry = journalEntryService.findById(objectId);
                if(journalEntry.isPresent()){
                    JournalEntry old = journalEntry.get();
                    old.setContent(newEntry.getContent() != null && !newEntry.getContent().equals("")
                            ? newEntry.getContent()
                            : old.getContent());
                    old.setTitle(newEntry.getTitle() != null && !newEntry.getTitle().equals("")
                            ? newEntry.getTitle()
                            : old.getTitle());
                    journalEntryService.saveEntry(old);
                    return new ResponseEntity<>(old, HttpStatus.OK);
                }
            }

            return new ResponseEntity<>("Entry not found", HttpStatus.NOT_FOUND);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid ID format", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to update entry", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Re-analyze journal entry with AI
     * FIXED: Changed from ObjectId to String parameter
     */
    @PostMapping("/reanalyze/{myId}")
    public ResponseEntity<?> reanalyzeEntry(@PathVariable String myId) {
        try {
            ObjectId objectId = new ObjectId(myId);
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userName = authentication.getName();
            User user = userService.findByUserName(userName);

            boolean exists = user.getJournalEntries().stream()
                    .anyMatch(entry -> entry.getId().equals(objectId));

            if (exists) {
                JournalEntry reanalyzedEntry = journalEntryService.reanalyzeEntry(objectId);
                return new ResponseEntity<>(reanalyzedEntry, HttpStatus.OK);
            }

            return new ResponseEntity<>("Entry not found or unauthorized", HttpStatus.NOT_FOUND);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>("Invalid ID format", HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Failed to re-analyze entry: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}