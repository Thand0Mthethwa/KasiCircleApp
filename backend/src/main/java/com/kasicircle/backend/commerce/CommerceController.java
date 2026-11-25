package com.kasicircle.backend.commerce;

import com.kasicircle.backend.shared.exception.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

import static com.kasicircle.backend.commerce.CommerceDtos.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
class CommerceController {
    private final CommerceService commerce;

    @GetMapping("/services")
    Page<Offering> services(@RequestParam ServiceOffering.ProviderType providerType, @RequestParam UUID providerId, Pageable page) {
        return commerce.list(providerType, providerId, page(page));
    }

    @GetMapping("/services/{id}")
    Offering service(@PathVariable UUID id) {
        return commerce.getOffering(id);
    }

    @GetMapping("/services/mine")
    Page<Offering> myServices(Principal principal, Pageable page) {
        return commerce.mine(principal.getName(), page(page));
    }

    @PostMapping("/services")
    @ResponseStatus(HttpStatus.CREATED)
    Offering createService(Principal principal, @Valid @RequestBody ServiceInput input) {
        return commerce.saveOffering(principal.getName(), null, input);
    }

    @PutMapping("/services/{id}")
    Offering editService(Principal principal, @PathVariable UUID id, @Valid @RequestBody ServiceInput input) {
        return commerce.saveOffering(principal.getName(), id, input);
    }

    @DeleteMapping("/services/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deactivateService(Principal principal, @PathVariable UUID id) {
        commerce.deactivate(principal.getName(), id);
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    BookingView createBooking(Principal principal, @Valid @RequestBody BookingInput input) {
        return commerce.request(principal.getName(), input);
    }

    @GetMapping("/bookings/my")
    Page<BookingView> myBookings(Principal principal, Pageable page) {
        return commerce.listBookings(principal.getName(), false, page(page));
    }

    @GetMapping("/bookings/provider")
    Page<BookingView> incomingBookings(Principal principal, Pageable page) {
        return commerce.listBookings(principal.getName(), true, page(page));
    }

    @GetMapping("/bookings/{id}")
    BookingView booking(Principal principal, @PathVariable UUID id) {
        return commerce.getBooking(principal.getName(), id);
    }

    @PatchMapping("/bookings/{id}/status")
    BookingView changeBooking(Principal principal, @PathVariable UUID id, @Valid @RequestBody Change input) {
        return commerce.updateBooking(principal.getName(), id, input);
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiErrorResponse invalidParameter(HttpServletRequest request) {
        return new ApiErrorResponse(Instant.now(), 400, "Bad Request",
                "A required request parameter is missing or invalid.", request.getRequestURI());
    }

    private Pageable page(Pageable requested) {
        return PageRequest.of(requested.getPageNumber(), Math.min(requested.getPageSize(), 50));
    }
}
