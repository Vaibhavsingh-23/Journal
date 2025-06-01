

package com.example.services;

import com.example.entity.User;
import com.example.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public void saveEntry(User user){
        userRepository.save(user);


    }
    public List<User> getAll(){
        return userRepository.findAll();
    }
    public User findByUserName(String userName){
        return userRepository.findByUserName(userName);
    }
    public void deleteById(ObjectId id){
        userRepository.deleteById(id);
    }
}
