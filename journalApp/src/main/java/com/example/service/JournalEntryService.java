

package com.example.service;

import com.example.entity.JournalEntry;
import com.example.entity.User;
import com.example.repository.JournalEntryRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class JournalEntryService {
    @Autowired
    private JournalEntryRepository journalEntryRepository;
    @Autowired
    private UserService userService;
    @Transactional
    public void saveEntry(JournalEntry journalEntry, String userName){
        try{
            User user = userService.findByUserName(userName);
            journalEntry.setDate(LocalDateTime.now());
            JournalEntry saved = journalEntryRepository.save(journalEntry);
            user.getJournalEntries().add(saved);
            userService.saveUser(user);
        } catch(Exception e){
            log.error("Exception" , e);
            throw new RuntimeException("An error occured while saving the entyr", e);
        }

    }
    public void saveEntry(JournalEntry journalEntry){
        try{

            journalEntryRepository.save(journalEntry);
        } catch(Exception e){
            log.error("Exception" , e);
        }

    }
    public List<JournalEntry> getAll(){
        return journalEntryRepository.findAll();
    }
    public Optional<JournalEntry> findById(ObjectId id){
        return journalEntryRepository.findById(id);
    }
    @Transactional
    public void deleteById(ObjectId id, String userName){
        try {
            User user = userService.findByUserName(userName);
            boolean removed = user.getJournalEntries().removeIf(x -> x.getId().equals(id));
            if (removed) {
                userService.saveUser(user);
                journalEntryRepository.deleteById(id);
            }
        }catch(Exception e){
            System.out.println(e);
            throw new RuntimeException("An error pccured while deleting the entry.",e);
        }
    }
//    public List<JournalEntry> findByUserName(String userName){
//
//    }

}
