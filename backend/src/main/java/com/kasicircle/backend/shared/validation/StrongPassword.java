package com.kasicircle.backend.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A custom validation annotation to ensure that a password meets specific strength requirements.
 * <p>
 * The validation is handled by {@link StrongPasswordValidator}. By default, a strong password must:
 * <ul>
 *     <li>Be at least 8 characters long.</li>
 *     <li>Contain at least one digit.</li>
 *     <li>Contain at least one lowercase letter.</li>
 *     <li>Contain at least one uppercase letter.</li>
 *     <li>Contain at least one special character (e.g., !@#$%^&*).</li>
 * </ul>
 *
 * Layer: Validation
 * @author KasiCircle Team
 * @since 1.0
 */
@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ ElementType.METHOD, ElementType.FIELD, ElementType.ANNOTATION_TYPE, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {
    /**
     * @return The error message to be returned if the validation fails.
     */
    String message() default "Password must be at least 8 characters long and contain at least one digit, one lowercase letter, one uppercase letter, and one special character.";

    /**
     * @return The validation groups this constraint belongs to.
     */
    Class<?>[] groups() default {};

    /**
     * @return The payload associated with this constraint.
     */
    Class<? extends Payload>[] payload() default {};
}
