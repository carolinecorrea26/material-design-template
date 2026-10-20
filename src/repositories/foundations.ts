import { persistence } from "../persistence/client";
import { createFoundationRepositories } from "./persistedRepositories";
export const foundationRepositories = createFoundationRepositories(persistence);
