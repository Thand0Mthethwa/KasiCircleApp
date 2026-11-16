package com.kasicircle.backend.places;

import com.kasicircle.backend.users.entity.AccountType;
import com.kasicircle.backend.users.repository.UserRepository;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/places")
public class PlaceSearchController {
    private final PlaceSearchService service;
    private final UserRepository users;
    public PlaceSearchController(PlaceSearchService service, UserRepository users) { this.service = service; this.users = users; }
    private String owner(Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to search places.");
        var user = users.findByEmail(principal.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Business account required."));
        if (user.getAccountType() != AccountType.BUSINESS) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Business account required.");
        return user.getId().toString();
    }
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> status(Principal principal) {
        owner(principal);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of("enabled", service.enabled()));
    }
    @GetMapping("/search")
    public ResponseEntity<PlaceSearchService.Results> search(@RequestParam(required = false) String q, Principal principal) {
        var user = owner(principal);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.search(q, user));
    }
}
