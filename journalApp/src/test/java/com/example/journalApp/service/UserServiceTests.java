package com.example.journalApp.service;

import com.example.entity.User;
import com.example.repository.UserRepository;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class UserServiceTests {

    @Autowired
    private UserRepository userRepository;

//    @Disabled
//    @Test
//    public void testFindByUserName() {
//        assertNotNull(userRepository.findByUserName("Puttu"));
//    }

    @Disabled
    @Test
    public void testFindByUserName(){
        User user = userRepository.findByUserName("Muttu");
        assertTrue(!user.getJournalEntries().isEmpty());
    }
    @Disabled
    @ParameterizedTest
    @CsvSource({
            "1,1,2",
            "2,3,5"
    })
    public void test(int a, int b,int expected){
        assertEquals(expected,a+b);
    }

    @ParameterizedTest
//    @CsvSource({
//            "Shiv",
//            "Puttu",
//            "Muttu"
//    })

    @Disabled
    @ValueSource(strings ={
            "Puttu",
            "Muttu"
    })
    public void  testFindByUserName(String name){
        assertNotNull(userRepository.findByUserName(name),"failed for"+ name);
    }
}

