package com.kasicircle.backend.commerce;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommerceControllerTest {
    @Test
    void malformedProviderFiltersAndUnknownIdFormatsReturnBadRequest() throws Exception {
        CommerceService commerce = mock(CommerceService.class);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new CommerceController(commerce)).build();

        mvc.perform(get("/api/services"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
        mvc.perform(get("/api/services/not-a-uuid"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(commerce);
    }
}
