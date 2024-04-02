import { Box, Button, Stack, TextField } from "@mui/material";
import { useEffect, useRef, useState, useCallback } from "react";
import Markdown from "react-markdown";
import axios, { isCancel, AxiosError } from "axios";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
interface Message {
  role: string;
  value: string;
  timestamp: string;
}

export function useChat() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setFinished] = useState(false);
  const [error, setError] = useState<unknown>();
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const chat = useCallback(
    async (msg: Message) => {
      setFinished(false);
      setIsLoading(true);
      setTokens([]);

      if (abortController) {
        abortController.abort();
      }
      const controller = new AbortController();
      const signal = controller.signal;
      setAbortController(controller);

      try {
        const stream = await getChatStream(msg);
        for await (const token of stream) {
          setTokens((prev) => [...prev, token]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // abort errors are expected
        }
        setError(err);
      }

      setIsLoading(false);
      setFinished(true);
      setAbortController(null);
    },
    [abortController]
  );

  const data = tokens.join("");
  return [chat, { data, isLoading, isFinished, error }] as const;
}

export async function* getIterableStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    const decodedChunk = decoder.decode(value, { stream: true });
    yield decodedChunk;
  }
}

export const getChatStream = async (
  message: Message
): Promise<AsyncIterable<string>> => {
  const response = await fetch("http://localhost:8000/chat", {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
  if (response.status !== 200) throw new Error(response.status.toString());
  if (!response.body) throw new Error("Response body does not exist");
  return getIterableStream(response.body);
};

export function Chatbox() {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [chat, { data, isLoading, isFinished, error }] = useChat();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    if (isFinished) {
      setHistory((history) => [
        ...history,
        { role: "ai", value: data, timestamp: new Date().toISOString() },
      ]);
    }
  }, [isFinished]);

  const sendMessage = async (value: string) => {
    const msg = { role: "user", value, timestamp: new Date().toISOString() };
    setHistory((history) => [...history, msg]);
    chat(msg);
    setInput("");
  };

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(input);
      }
    };
    document.addEventListener("keydown", listener);

    return () => {
      document.removeEventListener("keydown", listener);
    };
  });

  return (
    <Box
      sx={{
        width: "100%",
        height: "80vh",
        maxWidth: "70rem",
        maxHeight: "80rem",
        border: "5px solid rgba(255,255,255, 0.4)",
        borderRadius: "12px",
        color: "white",
        position: "relative",
      }}
    >
      <Stack sx={{ height: "100%" }} justifyContent={"space-between"}>
        <Box sx={{ height: "100%", overflowY: "auto", padding: "1rem" }}>
          {history.map((message, i) => (
            <Stack
              width={"100%"}
              key={i}
              justifyContent={
                message.role == "user" ? "flex-end" : "flex-start"
              }
              direction={"row"}
            >
              <Box
                sx={{
                  backgroundColor: "rgba(255,255,255,.4)",
                  width: "50%",
                  p: 1,
                  borderRadius: 2,
                  my: 1,
                  maxHeight: "50rem",
                  overflowY: "auto",
                }}
              >
                {message.role} : <Markdown>{message.value}</Markdown>
              </Box>
            </Stack>
          ))}
          {isLoading && (
            <Stack
              width={"100%"}
              justifyContent={"flex-start"}
              direction={"row"}
            >
              <Box
                sx={{
                  backgroundColor: "rgba(255,255,255,.4)",
                  width: "50%",
                  p: 1,
                  borderRadius: 2,
                  my: 1,
                  maxHeight: "50rem",
                  overflowY: "auto",
                }}
              >
                {"AI"} : <Markdown>{data}</Markdown>
              </Box>
            </Stack>
          )}
          <div ref={messagesEndRef} />
        </Box>
        <Box
          sx={{
            borderTop: "5px solid rgba(255,255,255, 0.4)",
          }}
        >
          <Stack direction={"row"}>
            <TextField
              autoFocus
              multiline
              value={input}
              onChange={(e) => setInput(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ color: "white" }}
            />
            <Button onClick={() => sendMessage(input)} variant="outlined">
              SEND
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
