import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// The painted layers are large, so fewer browser tabs at once keeps Chrome from running out of memory.
Config.setConcurrency(4);
// Google Fonts can be slow to answer, which would otherwise fail the whole render.
Config.setDelayRenderTimeoutInMilliseconds(120000);
