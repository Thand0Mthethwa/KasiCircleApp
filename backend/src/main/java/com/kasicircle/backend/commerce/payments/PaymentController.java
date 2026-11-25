package com.kasicircle.backend.commerce.payments;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.UUID;

import static com.kasicircle.backend.commerce.payments.PaymentModels.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
class PaymentController {
    private final PaymentService payments;

    @GetMapping("/history")
    History history(Principal principal, @RequestParam Kind kind, @RequestParam UUID id) {
        return payments.history(principal.getName(), new Target(kind, id));
    }

    @PostMapping("/initialize")
    View initialize(Principal principal, @Valid @RequestBody Target target) {
        return payments.initialize(principal.getName(), target);
    }

    @GetMapping("/{reference}")
    View status(Principal principal, @PathVariable String reference) {
        return payments.status(principal.getName(), reference);
    }

    @PostMapping("/{reference}/verify")
    View verify(Principal principal, @PathVariable String reference) {
        return payments.verify(principal.getName(), reference);
    }

    @PostMapping("/{reference}/simulate")
    View simulate(Principal principal, @PathVariable String reference, @Valid @RequestBody Simulation input) {
        return payments.simulate(principal.getName(), reference, input.outcome());
    }

    record Simulation(@NotNull PaymentGateway.Outcome outcome) {}
}
