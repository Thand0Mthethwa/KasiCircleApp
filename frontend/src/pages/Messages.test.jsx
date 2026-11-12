import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Messages from "./Messages";
import { messagingService } from "../services/api";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "current-user" } }),
}));

vi.mock("../services/api", () => ({
  messagingService: {
    getConversations: vi.fn(),
    createConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

const conversation = {
  id: "conversation-1",
  participantId: "worker-1",
  participantName: "Amahle Dube",
};

describe("Messages page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messagingService.getConversations.mockResolvedValue([]);
    messagingService.getMessages.mockResolvedValue({
      content: [],
      totalPages: 0,
    });
  });

  it("shows an explicit empty state when there are no conversations", async () => {
    render(
      <MemoryRouter>
        <Messages />
      </MemoryRouter>,
    );

    expect(
      await screen.findByTestId("conversation-empty-state"),
    ).toHaveTextContent("No conversations yet");
  });

  it("recovers from an initial conversation-list failure without reloading the page", async () => {
    messagingService.getConversations
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce([conversation]);
    render(
      <MemoryRouter>
        <Messages />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    fireEvent.click(
      screen.getByRole("button", { name: "Retry conversations" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: conversation.participantName,
      }),
    ).toBeInTheDocument();
    expect(messagingService.getConversations).toHaveBeenCalledTimes(2);
  });

  it("starts a conversation from a profile link and sends messages", async () => {
    messagingService.createConversation.mockResolvedValue(conversation);
    messagingService.getConversations
      .mockResolvedValueOnce([])
      .mockResolvedValue([conversation]);
    messagingService.getMessages.mockResolvedValue({
      content: [],
      totalPages: 1,
    });
    messagingService.sendMessage.mockResolvedValue({
      id: "message-1",
      senderName: "Current User",
      content: "Hello, I am interested.",
    });

    render(
      <MemoryRouter initialEntries={["/messages?participant=worker-1"]}>
        <Messages />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(messagingService.createConversation).toHaveBeenCalled(),
    );
    expect(
      await screen.findByRole(
        "heading",
        { name: "Amahle Dube" },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    expect(messagingService.createConversation).toHaveBeenCalledWith(
      "worker-1",
    );
    fireEvent.change(screen.getByLabelText("Write a message"), {
      target: { value: "Hello, I am interested." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("Hello, I am interested."),
    ).toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent("Message sent");
    await waitFor(() => {
      expect(messagingService.sendMessage).toHaveBeenCalledWith(
        "conversation-1",
        "Hello, I am interested.",
      );
    });
  });

  it("loads older messages from the paginated conversation history", async () => {
    messagingService.getConversations.mockResolvedValue([conversation]);
    messagingService.getMessages
      .mockResolvedValueOnce({
        content: [
          {
            id: "message-new",
            senderName: "Amahle",
            content: "Newest message.",
          },
        ],
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: "message-old",
            senderName: "Current User",
            content: "Older message.",
          },
        ],
        totalPages: 2,
      });

    render(
      <MemoryRouter initialEntries={["/messages?conversation=conversation-1"]}>
        <Messages />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Newest message.")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Load older messages" }),
    );

    expect(await screen.findByText("Older message.")).toBeInTheDocument();
    expect(messagingService.getMessages).toHaveBeenLastCalledWith(
      "conversation-1",
      1,
      50,
    );
  });

  it("reports message loading failures", async () => {
    messagingService.getConversations.mockResolvedValue([conversation]);
    messagingService.getMessages.mockRejectedValue(
      new Error("Message history unavailable"),
    );

    render(
      <MemoryRouter>
        <Messages />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Message history unavailable",
    );
  });
});
