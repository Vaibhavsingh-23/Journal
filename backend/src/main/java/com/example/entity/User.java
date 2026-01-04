package com.example.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor

public class User {

    @Id
    private ObjectId _id;

    public String getId() {
        return _id != null ? _id.toHexString() : null;
    }

    @Indexed(unique = true)
    @NonNull
    @Field("username")
    private String userName;


    @NonNull
    private String password;

    private List<String> roles;
    @DBRef
    private List<JournalEntry> journalEntries = new ArrayList<>();


}
