import type { Decorator } from "@storybook/react-vite";
import { Box } from "@mui/material";
/** Section surface only; standalone examples do not install application state. */
const withHomeStoryFrame: Decorator = Story => <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3, md: 4 } }}><Story /></Box>;
export default withHomeStoryFrame;
