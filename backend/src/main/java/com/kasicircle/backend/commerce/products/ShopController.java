package com.kasicircle.backend.commerce.products;

import com.kasicircle.backend.shared.exception.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.security.Principal;
import java.time.Instant;
import java.util.UUID;

import static com.kasicircle.backend.commerce.products.ShopModels.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
class ShopController {
    private final ShopService shop;

    @GetMapping("/businesses/{id}/products")
    Listing<CatalogItem> catalog(@PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
        return shop.catalog(id, page);
    }

    @GetMapping("/products/mine")
    Listing<Product> products(Principal principal, @RequestParam(defaultValue = "0") int page) {
        return shop.products(principal.getName(), page);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    Product create(Principal principal, @Valid @RequestBody ProductInput input) {
        return shop.save(principal.getName(), null, input);
    }

    @PutMapping("/products/{id}")
    Product edit(Principal principal, @PathVariable UUID id, @Valid @RequestBody ProductInput input) {
        return shop.save(principal.getName(), id, input);
    }

    @PostMapping("/orders/review")
    Review review(@Valid @RequestBody ReviewInput input) {
        return shop.review(input);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    Detail place(Principal principal, @Valid @RequestBody PlaceInput input) {
        return shop.place(principal.getName(), input);
    }

    @GetMapping("/orders/my")
    Listing<Summary> myOrders(Principal principal, @RequestParam(defaultValue = "0") int page) {
        return shop.orders(principal.getName(), false, page);
    }

    @GetMapping("/orders/incoming")
    Listing<Summary> incoming(Principal principal, @RequestParam(defaultValue = "0") int page) {
        return shop.orders(principal.getName(), true, page);
    }

    @GetMapping("/orders/{id}")
    Detail order(Principal principal, @PathVariable UUID id) {
        return shop.order(principal.getName(), id);
    }

    @PatchMapping("/orders/{id}/status")
    Detail change(Principal principal, @PathVariable UUID id, @Valid @RequestBody Change change) {
        return shop.change(principal.getName(), id, change);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    ApiErrorResponse invalidParameter(HttpServletRequest request) {
        return new ApiErrorResponse(Instant.now(), 400, "Bad Request",
                "A request parameter is invalid.", request.getRequestURI());
    }
}
