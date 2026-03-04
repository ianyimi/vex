const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const PREFIX = `${CYAN}[vex]${RESET}`;

export const logger = {
  info(msg: string) {
    console.log(`${PREFIX} ${msg}`);
  },

  success(msg: string) {
    console.log(`${PREFIX} ${GREEN}${msg}${RESET}`);
  },

  warn(msg: string) {
    console.log(`${PREFIX} ${YELLOW}${msg}${RESET}`);
  },

  error(msg: string, err?: unknown) {
    console.error(`${PREFIX} ${RED}${msg}${RESET}`);
    if (err instanceof Error) {
      const stack = err.stack ?? err.message;
      console.error(`${DIM}${stack}${RESET}`);
    }
  },
};
