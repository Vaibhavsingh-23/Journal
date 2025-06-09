package com.example.controller;

import com.example.entity.User;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public")
public class PublicController {
    @Autowired
    private UserService userService;

    @GetMapping("/health-check")
    public String healthCheck(){
        return "ok";

    }

    @PostMapping("/create-user")
    public ResponseEntity<User> createUser(@RequestBody User user){
        userService.saveNewUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
}
