"use client";
import { Stack } from "@mui/material";
import { Blob, Chatbox, Logo } from "./components";
import "./page.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      light: grey[300],
      main: grey[500],
      dark: grey[700],
    },
  },
});

export default function Home() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Stack
        direction={"column"}
        justifyContent={"center"}
        alignItems={"center"}
        spacing={6}
        sx={{ marginTop: "1rem" }}
      >
        <Logo />
        <Blob color="#8532fa" />
        <Chatbox />
      </Stack>
    </ThemeProvider>
  );
}
