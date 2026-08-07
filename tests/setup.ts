import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sem `globals: true` a Testing Library não registra a limpeza automática, e o
// DOM de um teste vaza para o seguinte — o sintoma é "found multiple elements".
afterEach(cleanup);
