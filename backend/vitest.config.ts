import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /**
     * Disable file-level parallelism to prevent race conditions in shared-database tests.
     * Integration tests share a single Postgres database and use a common cleanup convention
     * (deleteMany with 'test-' prefix). When files run in parallel, one file's cleanup can
     * delete rows that another file's in-flight test just created, causing flaky failures.
     * Setting fileParallelism to false ensures all test files run sequentially.
     */
    fileParallelism: false,
  },
});
