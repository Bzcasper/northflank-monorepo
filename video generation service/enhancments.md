# Short Video Maker Project Enhancements

This document outlines a comprehensive analysis and recommendations for enhancing the Shorts Creator project, focusing on improving functionality, usability, performance, and integrating advanced AI capabilities while leveraging free-tier cloud services.

## Project Overview

The Shorts Creator is an open-source tool designed for generating short-form videos for platforms like TikTok, Instagram Reels, and YouTube Shorts. It automates video creation by utilizing text-to-speech (Kokoro), automatic captions (Whisper), background videos from Pexels, and background music. The project supports both Model Context Protocol (MCP) and REST API interactions, complemented by a web UI for browser-based video generation. Key dependencies include Remotion (version 4.0.286), kokoro-js (1.2.0), and fluent-ffmpeg, with Docker support for deployment, including a CUDA-optimized image for GPU acceleration.

Current limitations include English-only voiceover support due to Kokoro limitations and reliance on Pexels for background videos. User feedback highlights interest in GPU usage, language support, deployment challenges, and feature requests.

## Detailed Enhancement Recommendations

### 1. Multi-language Support

Adding support for languages beyond English, such as Spanish, French, and Japanese, can significantly expand the project's reach.

- **Configuration Update**: Add a `language` field to `RenderConfig` in [`src/types/shorts.ts`](src/types/shorts.ts) using an enum:

  ```typescript
  export enum LanguageEnum {
    en = "en",
    es = "es",
    fr = "fr",
    // Add other supported languages
  }
  ```

  Update `renderConfig` to include:

  ```typescript
  language: z.nativeEnum(LanguageEnum).optional().default(LanguageEnum.en),
  ```

- **Voice Mapping**: Create a mapping in [`src/short-creator/libraries/Kokoro.ts`](src/short-creator/libraries/Kokoro.ts) to associate languages with default voices. For example:

  - English: `af_heart`, `am_adam`, etc. (existing `VoiceEnum`).
  - Spanish: Assume voices like `es_xxx` based on Kokoro documentation (e.g., from VOICES.md, Spanish has 3 voices, one female, two male).
  - Use `listAvailableVoices()` to filter by language if possible, or hardcode based on documentation.

- **Whisper Model Selection**: In [`src/short-creator/ShortCreator.ts`](src/short-creator/ShortCreator.ts), for non-English languages, use `medium` (multi-lingual) instead of `medium.en` for Whisper transcription. Modify [`src/short-creator/libraries/Whisper.ts`](src/short-creator/libraries/Whisper.ts) to accept the model per `CreateCaption` call:

  ```typescript
  async CreateCaption(audioPath: string, model: whisperModels): Promise<Caption[]> {
    // Use specified model for transcription
  }
  ```

  In `createShort`, select the model based on language:

  ```typescript
  const whisperModel = config.language === "en" ? "medium.en" : "medium";
  const captions = await this.whisper.CreateCaption(tempWavPath, whisperModel);
  ```

- **Font and Rendering**: Ensure Remotion components ([`src/components/videos/PortraitVideo.tsx`](src/components/videos/PortraitVideo.tsx), [`src/components/videos/LandscapeVideo.tsx`](src/components/videos/LandscapeVideo.tsx)) use fonts like Barlow Condensed, which supports Latin-based scripts. For non-Latin scripts, consider adding font options or using system fonts with broad language support.

  _Supporting URL: [https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)_

### 2. Dependency Updates

Updating dependencies to their latest versions can improve performance and security.

- **Update `package.json`**: Reflect the latest versions:
  - Remotion: `"@remotion/bundler": "^4.0.321"`, etc., for all `@remotion/*` packages.
  - Check `kokoro-js`: Already at 1.2.0, update to 1.2.1 if applicable.
  - Review other dependencies like `fluent-ffmpeg` (2.1.3) for updates, ensuring compatibility.
- **Testing**: Test the updated dependencies in a development environment to ensure no breaking changes, especially for Remotion, given its integration with video rendering.

  _Supporting URL: [https://www.npmjs.com/package/remotion](https://www.npmjs.com/package/remotion), [https://www.npmjs.com/package/kokoro-js](https://www.npmjs.com/package/kokoro-js)_

### 3. Documentation Improvements

Enhance user guidance by:

- **Update `README.md`**: Include a section on GPU usage, detailing that `whisper.cpp` uses GPU for transcription (CUDA image: `gyoridavid/short-video-maker:latest-cuda`), while Remotion is CPU-intensive, with links to Remotion documentation for clarity.
- **Example Docker Commands**: Add example Docker commands with GPU flags, addressing user-reported naming issues (e.g., `gyoridavid/shorts-creator` vs. `gyoridavid/short-video-maker`).
- **Tutorials**: Provide tutorials for multi-language setup, including how to select voices and models, with example API calls.
- **`CONTRIBUTING.md`**: Enhance with setup instructions for development, including testing multi-language support and GPU environments.

### 4. Bug Fixes and Stability

Address reported issues, such as errors with Remotion in the CUDA image, to ensure reliability.

- **Investigate Errors**: Investigate the reported error (`{"columnNumber":24,"fileName":"http://localhost:3000/bundle.js","functionName":null,"lineNumber":69490}]},"msg":"Error creating video"}`) by testing the CUDA image in a controlled environment, focusing on Remotion rendering.
- **Logging**: Log detailed error messages in [`src/short-creator/ShortCreator.ts`](src/short-creator/ShortCreator.ts) and [`src/server/routers/rest.ts`](src/server/routers/rest.ts) to aid debugging, especially for video creation failures.
- **Retry Mechanisms**: Consider adding retry mechanisms or fallback options in `createShort` for failed Pexels API calls or rendering errors.

### 5. Additional Features: Square Video Support

Current orientations are portrait (1080x1920) and landscape (1920x1080), but square videos (e.g., 1080x1080) are popular for Instagram.

- **Update `OrientationEnum`**: Add `square` to `OrientationEnum` in [`src/types/shorts.ts`](src/types/shorts.ts):

  ```typescript
  export enum OrientationEnum {
    landscape = "landscape",
    portrait = "portrait",
    square = "square",
  }
  ```

- **Update `getOrientationConfig`**: In [`src/components/utils.ts`](src/components/utils.ts) to include:

  ```typescript
  square: {
    width: 1080,
    height: 1080,
    component: AvailableComponentsEnum.SquareVideo, // New component
  },
  ```

- **New Component**: Create a new [`SquareVideo.tsx`](src/components/videos/SquareVideo.tsx) in [`src/components/videos/`](src/components/videos/), similar to [`PortraitVideo.tsx`](src/components/videos/PortraitVideo.tsx), adjusting styles for square aspect ratio.
- **Update `RemotionRoot`**: In [`src/components/root/Root.tsx`](src/components/root/Root.tsx) to include a composition for `SquareVideo`.

## User Feedback Insights

Key user feedback from a Reddit discussion (April 22, 2025) includes:

- Interest in GPU acceleration, with confusion around Docker usage.
- Language support, with one user adapting for Spanish, suggesting multi-language is feasible.
- Deployment queries, especially for n8n integration, suggesting clearer cloud deployment guides.
- Feature requests like marketing automation, which could be supported by enhancing MCP tools or providing workflow examples.

## Supporting Tables

Below is a table summarizing the language support from Kokoro, based on VOICES.md accessed July 14, 2025:

| Language             | Female Voices | Male Voices | Total Voices | Notes                                                             |
| :------------------- | :------------ | :---------- | :----------- | :---------------------------------------------------------------- |
| American English     | 11            | 9           | 20           | lang_code='a', espeak-ng en-us fallback                           |
| British English      | 4             | 4           | 8            | lang_code='b', espeak-ng en-gb fallback                           |
| Japanese             | 4             | 1           | 5            | lang_code='j', Total training data: H hours, CC BY links provided |
| Mandarin Chinese     | 4             | 4           | 8            | lang_code='z', Total training data: H hours                       |
| Spanish              | 1             | 2           | 3            | lang_code='e', espeak-ng es                                       |
| French               | 1             | 0           | 1            | lang_code='f', Total training data: <11 hours, CC BY: SIWIS       |
| Hindi                | 2             | 2           | 4            | lang_code='h', Total training data: H hours                       |
| Italian              | 1             | 1           | 2            | lang_code='i', Total training data: H hours                       |
| Brazilian Portuguese | 1             | 2           | 3            | lang_code='p', espeak-ng pt-br                                    |

## Conclusion

By focusing on multi-language support, dependency updates, documentation, bug fixes, and new features like square video support, the Shorts Creator project can significantly enhance its usability, performance, and market reach. These recommendations align with user feedback and technical feasibility, ensuring the project remains a valuable tool for automated video creation.

## AI Integration with Cloudflare and Vercel Free Tiers

To enhance your short video maker project using AI while leveraging the free tiers of Cloudflare and Vercel, you can integrate several AI-driven features that improve content quality, streamline the creative process, and optimize performance.

### 1. AI-Powered Caption Enhancement with Cloudflare Workers AI

- **What it does**: Improves the accuracy and versatility of captions generated by your existing transcription system (e.g., Whisper).
- **How to Implement**: Use Cloudflare Workers AI to perform sentiment analysis on input text and adjust captions to match the tone, or translate captions into multiple languages. Integrate by making an API call from your application to the Worker.
- **Free Tier Fit**: Cloudflare's free tier for Workers AI includes a limited number of inference tasks, sufficient for moderate video processing.
- **Benefits**: Higher-quality captions that align with the video's mood and multi-language support.

### 2. AI-Generated Video and Music Suggestions with Vercel AI SDK

- **What it does**: Provides smart recommendations for background videos and music based on your video's content.
- **How to Implement**: Integrate the Vercel AI SDK into your serverless functions on Vercel. Use the SDK to analyze input text or script, extract key themes, and suggest relevant background videos (e.g., from Pexels API) or music tracks.
- **Free Tier Fit**: Vercel's free tier includes a set number of serverless function invocations, adequate for generating suggestions for a moderate number of videos.
- **Benefits**: Saves users time by automating the selection of fitting visuals and audio, enhancing video coherence and engagement.

### 3. AI-Optimized Rendering for Faster Processing

- **What it does**: Speeds up video rendering by optimizing settings with AI predictions.
- **How to Implement**: Use Cloudflare Workers AI or Vercel AI SDK to analyze past rendering data and predict optimal configurations for tools like Remotion (e.g., concurrency levels, resolution settings). Deploy as a lightweight service returning recommendations to your rendering pipeline.
- **Free Tier Fit**: Both platforms’ free tiers support running small-scale AI models for this purpose, given the low computational demand of analyzing rendering metadata.
- **Benefits**: Faster video output, improving user experience and efficient resource use.

### 4. AI-Assisted Script Writing with Vercel AI SDK

- **What it does**: Helps users create or refine video scripts using AI-generated suggestions.
- **How to Implement**: Leverage the Vercel AI SDK to build a serverless function that generates script ideas or improves existing text based on user input. Integrate as an optional feature in your UI.
- **Free Tier Fit**: Vercel’s free tier can handle text generation for a reasonable number of requests.
- **Benefits**: Empowers users with limited writing skills to produce compelling content and speeds up the scriptwriting process.

### How to Integrate These Enhancements

- **Architecture**: Keep your core application running on its existing setup (e.g., Docker or local server). Offload AI tasks to Cloudflare Workers or Vercel serverless functions via simple API calls.
- **Example data flow**: Input text → API call to Cloudflare for caption enhancement → API call to Vercel for script suggestions → Combine results in your app.
- **Error Handling**: Add fallback mechanisms (e.g., default captions or manual settings) to handle rate limits or service downtime.
- **User Experience**: Introduce an "AI Suggestions" feature in your interface, where users can toggle AI enhancements.

### Why This Works with Free Tiers

- **Cloudflare Workers AI**: The free tier supports a limited number of AI inference tasks, ideal for caption enhancement or rendering optimization in a small-to-medium-scale project.
- **Vercel AI SDK**: The free tier’s serverless function invocations cover script generation and content suggestions for moderate usage.
- Both platforms’ limits align with a typical open-source project’s needs, assuming it’s not processing thousands of videos daily.

### Additional Tips

- **Documentation**: Update your `README.md` with clear instructions on setting up these AI features, including API key setup (if needed) and code examples.
- **Modularity**: Create separate modules for AI integrations (e.g., `ai-captions.js`, `ai-suggestions.js`) to keep the codebase clean and maintainable.

### Final Thoughts

By adding AI-powered caption enhancement, video/music suggestions, rendering optimization, and scriptwriting assistance, you can significantly boost your short video maker’s capabilities. These enhancements leverage Cloudflare and Vercel’s free tiers effectively, keeping your project cost-free while delivering a more powerful, user-friendly tool.

## n8n and Suno AI Integration

This section provides a comprehensive guide to integrate n8n with Suno AI to generate music, add enhancements, and create a final video artifact using your existing short video maker project with Remotion. This workflow automates the process and enhances your videos with AI-generated visuals and lyrics.

### Enhanced Step-by-Step Plan to Add All Enhancements

This plan integrates n8n and Suno AI-generated music into your Short Video Maker project, incorporating all enhancements from prior discussions and adding new ones to align with your jewelry e-commerce platform’s AI-driven automation goals. The plan leverages Cloudflare Workers AI, Vercel AI SDK, and n8n workflows to enhance video creation with AI-generated music, visuals, lyrics, and captions, while ensuring compatibility with free-tier services and your existing React-based UI (`VideoList.jsx`).

#### 1. Set Up n8n Workflow for Automation

- **Purpose**: Automate the entire video creation pipeline, from music generation to final video rendering, using n8n for orchestration.
- **Enhancements**:
  - Integrate with your existing MCP servers (e.g., `context7`, `filesystem`, `sequentialthinking`) for enhanced AI processing.
  - Add error handling and retry mechanisms to manage API failures.
  - Include notifications (e.g., via email or Slack) for workflow completion or errors.
- **Steps**:
  - Deploy n8n on Vercel’s free tier or locally via Docker.
  - Create a new n8n workflow named `suno-video-workflow` with nodes for Suno AI music generation, AI visual generation, lyric creation, and video rendering.
  - Configure a Webhook node to trigger the workflow when a new video creation request is made via your `VideoList` UI.
  - Add a Set node to store environment variables (e.g., Suno AI API key, Cloudflare Workers AI endpoint) securely.
  - Include a Switch node to handle different video orientations (portrait, landscape, square) based on user input from the UI.

#### 2. Generate Music with Suno AI

- **Purpose**: Create custom background music tailored to the video’s theme using Suno AI.
- **Enhancements**:
  - Allow users to specify music mood (e.g., happy, chill) via the UI, matching your project’s `MusicMoodEnum`.
  - Use AI to analyze the video script’s sentiment to suggest appropriate music, leveraging Cloudflare Workers AI for sentiment analysis.
  - Cache generated music files in Cloudflare’s KV storage to reduce API calls, optimizing for free-tier limits.
- **Steps**:
  - Obtain a Suno AI API key and add it to your `.env` file.
  - In the n8n workflow, add an HTTP Request node to call the Suno AI API with a prompt (e.g., “upbeat city vibe, 30 seconds”).
  - Use a Wait node to poll for music generation completion, then download the MP3 to a temporary folder (e.g., `/tmp/suno_music`).
  - Add the generated music file to your project’s `static/music` directory and update [`src/short-creator/music.ts`](src/short-creator/music.ts) with a new record, specifying mood and start/end times.

#### 3. Generate AI-Driven Visuals

- **Purpose**: Enhance videos with AI-generated visuals (images or short clips) that match the music and script.
- **Enhancements**:
  - Use Stable Diffusion via Cloudflare Workers AI to generate visuals.
  - Allow users to upload custom images or videos.
  - Support jewelry-specific visual generation (e.g., “vintage necklace on velvet background”) for your e-commerce use case.
- **Steps**:
  - Add an HTTP Request node in n8n to call Stable Diffusion’s API (via Cloudflare Workers AI) with a prompt derived from the video script or user input.
  - Store generated visuals in a temporary folder (e.g., `/tmp/visuals`) or Cloudflare R2 for free-tier storage.
  - Update [`src/short-creator/ShortCreator.ts`](src/short-creator/ShortCreator.ts) to accept custom visuals as an alternative to Pexels videos, with a fallback to Pexels if generation fails.

#### 4. Generate AI-Driven Lyrics and Captions

- **Purpose**: Create lyrics and captions that enhance video engagement, tailored to the music and visual theme.
- **Enhancements**:
  - Use Vercel AI SDK to generate lyrics and captions, supporting multi-language output (e.g., Spanish, French).
  - Enhance captions with font customization (e.g., Barlow Condensed) and dynamic styling.
  - Add sentiment-aware captions (e.g., upbeat tone for “happy” music) using Cloudflare Workers AI.
- **Steps**:
  - Add a Vercel serverless function (`/api/generate-lyrics`) using Vercel AI SDK to create lyrics based on the video script and music mood.
  - In n8n, add an HTTP Request node to call this function and retrieve lyrics as text.
  - Modify [`src/short-creator/libraries/Whisper.ts`](src/short-creator/libraries/Whisper.ts) to use a multi-lingual Whisper model (e.g., `medium`) for non-English captions, controlled by a language field in `RenderConfig`.
  - Update [`PortraitVideo.tsx`](src/components/videos/PortraitVideo.tsx), [`LandscapeVideo.tsx`](src/components/videos/LandscapeVideo.tsx), and a new [`SquareVideo.tsx`](src/components/videos/SquareVideo.tsx) to support dynamic caption styling (e.g., `captionFontSize`, `captionColor`).

#### 5. Integrate with Remotion for Video Rendering

- **Purpose**: Render the final video using Remotion, incorporating AI-generated music, visuals, and lyrics/captions.
- **Enhancements**:
  - Add square video support (1080x1080) for Instagram.
  - Optimize rendering settings using AI predictions from Cloudflare Workers AI, reducing processing time.
  - Add audio-reactive visual effects (e.g., pulsating captions) to enhance engagement.
- **Steps**:
  - Create a new [`SquareVideo.tsx`](src/components/videos/SquareVideo.tsx) component in [`src/components/videos/`](src/components/videos/) for 1080x1080 output, mirroring [`PortraitVideo.tsx`](src/components/videos/PortraitVideo.tsx) with adjusted dimensions.
  - Update [`src/components/utils.ts`](src/components/utils.ts) to include square orientation in `OrientationEnum` and `getOrientationConfig`.
  - In n8n, add an Execute Command node to run `npx remotion render` with dynamic inputs (music file, visuals, captions, orientation).
  - Use Cloudflare Workers AI to predict optimal rendering settings (e.g., concurrency, resolution) and pass them as parameters.

#### 6. Enhance VideoList UI for User Interaction

- **Purpose**: Update the `VideoList` component to support new features like music selection, visual previews, and language options.
- **Enhancements**:
  - Add a dropdown for music mood selection and a file upload for custom visuals.
  - Include a language selector for captions and lyrics.
  - Integrate with n8n workflow triggers via an API call from the UI.
- **Steps**:
  - Add a `Select` component to [`VideoList.jsx`](video_list.jsx) for choosing music mood and language.
  - Include a file input for custom visual uploads, sending them to the n8n workflow via an API endpoint.
  - Add a button to trigger the n8n workflow, calling `/api/trigger-workflow` to initiate video creation.

#### 7. Polish and Distribute the Final Video

- **Purpose**: Finalize the video with post-processing and distribute it to platforms or storage.
- **Enhancements**:
  - Add a watermark with your jewelry store’s branding using FFmpeg.
  - Upload videos to Cloudflare Stream for free-tier video hosting.
  - Notify users via n8n (e.g., email or Slack) upon completion.
- **Steps**:
  - In n8n, add an FFmpeg node to add a watermark (e.g., your store’s logo) and compress the video.
  - Add a Cloudflare Stream node to upload the final video, using the free tier’s storage limits.
  - Configure a notification node (e.g., Email or Slack) to alert users when the video is ready.

#### 8. Documentation and Testing

- **Purpose**: Ensure the enhancements are well-documented and tested for reliability.
- **Enhancements**:
  - Update `README.md` with setup instructions for n8n, Suno AI, and Cloudflare/Vercel integrations.
  - Add automated tests for the n8n workflow and UI changes.
- **Steps**:
  - Update [`static/music/README.md`](short-video-maker/static/music/README.md) with instructions for adding Suno AI-generated music.
  - Create a `docs/n8n-workflow.md` file detailing the workflow setup and API integrations.
  - Add tests in [`vitest.config.ts`](short-video-maker/vitest.config.ts) for the new UI components and API endpoints.

### Enhanced Step-by-Step Plan to Overcome Suno AI’s Lack of Official API Key

This plan addresses the challenge of Suno AI not providing an official API key, leveraging unofficial APIs, alternative music generation tools, and local solutions.

#### 1. Use an Unofficial Suno AI API

- **Purpose**: Leverage unofficial APIs that reverse-engineer Suno AI’s music generation capabilities.
- **Enhancements**:
  - Use a well-documented unofficial API like [gcui-art/suno-api](https://github.com/gcui-art/suno-api) or [SunoAI-API/Suno-API](https://github.com/SunoAI-API/Suno-API), which support music and lyric generation without requiring an official key.
  - Automate setup with n8n to streamline integration.
  - Cache generated music in Cloudflare KV storage to reduce CAPTCHA issues and optimize free-tier usage.
- **Steps**:

  - Clone the `gcui-art/suno-api` repository from GitHub: `git clone https://github.com/gcui-art/suno-api.git`.
  - Install dependencies: `cd suno-api && npm install`.
  - Obtain a Suno AI session cookie:
    - Sign up at [suno.com](https://suno.com) and log in.
    - Open browser Developer Tools (F12), navigate to the Network tab, and copy the `Cookie` header (look for `client` or `clerk` values) from a request to `suno.com`.
  - Create a `.env` file in the project root with:

    ```text
    SUNO_COOKIE=<your_cookie_value>
    TWOCAPTCHA_KEY=<your_2captcha_key>
    BROWSER=chromium
    BROWSER_GHOST_CURSOR=false
    BROWSER_LOCALE=en
    BROWSER_HEADLESS=true
    ```

  - Sign up for a 2Captcha account to handle CAPTCHAs, add funds, and get an API key for `TWOCAPTCHA_KEY`. Use ruCaptcha if in Russia or Belarus.
  - Deploy locally or on Vercel:
    - Local: Run `npm run dev` and test at `http://localhost:3000/api/get_limit`.
    - Vercel: Deploy via the Vercel dashboard and add environment variables.
  - In your n8n workflow (`suno-video-workflow.json`), update the Generate Music node to call `http://<your-vercel-domain>/api/custom_generate` with a JSON payload:

    ```json
    {
      "prompt": "upbeat {{$node['Set Config'].json['mood']}} music for {{$node['Set Config'].json['script']}}",
      "style": "pop",
      "customMode": true,
      "lyrics": "{{$node['Generate Lyrics'].json['lyrics']}}"
    }
    ```

  - Cache the generated music URL in Cloudflare KV using a node in n8n to reduce API calls.

#### 2. Explore Free Suno AI API Alternatives

- **Purpose**: Use alternative AI music generation APIs that don’t require an API key or offer free tiers.
- **Enhancements**:
  - Select tools like [Beatoven.ai](https://www.beatoven.ai/) or [Riffusion](https://www.riffusion.com/), which offer free tiers and no API key requirements.
  - Integrate with your jewelry platform’s video content needs (e.g., mood-based music for product showcases).
  - Add multi-language support for lyrics and captions.
- **Steps**:

  - Choose [Beatoven.ai](https://www.beatoven.ai/) for its free tier and text-to-music capabilities:

    - Sign up at [beatoven.ai](https://www.beatoven.ai/) (no API key required for free tier).
    - Use their API endpoint `https://api.beatoven.ai/v1/generate` with a simple POST request:

      ```json
      {
        "prompt": "jewelry-themed upbeat pop track",
        "mood": "{{$node['Set Config'].json['mood']}}",
        "genre": "pop",
        "duration": 30
      }
      ```

    - Update your n8n workflow to replace the Suno AI Generate Music node with a Beatoven.ai HTTP Request node.
    - For lyrics, use Vercel AI SDK to generate multi-language lyrics, and sync them with Beatoven.ai’s instrumental tracks.

  - Test [Riffusion](https://www.riffusion.com/) as a fallback (open-source, no API key needed):
    - Clone [https://github.com/riffusion/riffusion](https://github.com/riffusion/riffusion) and run locally.
    - Use its spectrogram-based music generation for creative sound design.
  - Store generated tracks in `/tmp/suno_music` and update [`src/short-creator/music.ts`](src/short-creator/music.ts) with new records.

#### 3. Run a Local AI Music Model

- **Purpose**: Host a local music generation model to avoid API dependencies entirely, ensuring full control and no CAPTCHA issues.
- **Enhancements**:
  - Use open-source models like YuE or Stable Audio Tools to generate music locally.
  - Optimize for your Ubuntu 24.04 LTS environment, leveraging your MCP server setup.
  - Integrate with your jewelry platform’s image-based automation (e.g., YOLO, CLIP) to generate music inspired by jewelry visuals.
- **Steps**:

  - Install YuE, a 7B parameter model for song generation:
    - Clone [https://github.com/google-research/perch](https://github.com/google-research/perch) and follow setup instructions.
    - Install dependencies: `pip install -r requirements.txt`.
    - Download model checkpoints from Hugging Face.
  - Configure a local server to run YuE:

    - Use a Python script to generate music from text prompts:

      ```python
      from perch import MusicGenerator
      generator = MusicGenerator(model_path="path/to/yue/checkpoint")
      audio = generator.generate(
          prompt="upbeat pop for vintage jewelry ad",
          lyrics="{{$node['Generate Lyrics'].json['lyrics']}}",
          duration=30
      )
      audio.save("/tmp/suno_music/yue_output.mp3")
      ```

    - Add a Python Execute node in n8n to call this script, replacing the Suno AI node.
    - Use your MCP server (e.g., `context7`) to run the model, leveraging GPU acceleration if available.
    - Cache outputs in Cloudflare R2 for integration with your video rendering pipeline.

#### 4. Enhance n8n Workflow for Robustness

- **Purpose**: Update your n8n workflow to handle unofficial APIs or local models seamlessly, with error handling and retries.
- **Enhancements**:
  - Add retry logic for CAPTCHA failures.
  - Include a fallback to alternative APIs or local models if the primary method fails.
  - Notify users via email or Slack for workflow status.
- **Steps**:

  - Update `suno-video-workflow.json` to include a Switch node for method selection:
    - Option 1: Unofficial Suno API.
    - Option 2: Beatoven.ai API.
    - Option 3: Local YuE model.
  - Add an Error Workflow node to retry failed API calls up to 3 times with a 10-second delay.
  - Include a notification node (e.g., Email Send) to alert users on success or failure:

    ```json
    {
      "to": "{{$env.NOTIFICATION_EMAIL}}",
      "subject": "Music Generation Status",
      "text": "Music generation {{($node['Generate Music'].json['success'] ? 'succeeded' : 'failed')}} for video ID {{$node['Generate Music'].json['id']}}"
    }
    ```

  - Validate outputs by checking for non-null audio files before proceeding to video rendering.

#### 5. Update VideoList UI for Flexibility

- **Purpose**: Enhance the `VideoList` component to support music source selection and display generation status.
- **Enhancements**:
  - Add a dropdown to choose between Suno API, Beatoven.ai, or local YuE.
  - Show real-time generation status (e.g., “Generating Music”) using WebSocket updates.
  - Support multi-language captions for music lyrics.
- **Steps**:

  - Modify [`VideoList.jsx`](video_list.jsx) to include a `Select` component for music source:

    ```jsx
    <Select
      label="Music Source"
      value={musicSource}
      onChange={(e) => setMusicSource(e.target.value)}
      options={[
        { value: "suno", label: "Suno AI (Unofficial)" },
        { value: "beatoven", label: "Beatoven.ai" },
        { value: "yue", label: "Local YuE" },
      ]}
    />
    ```

  - Add a WebSocket connection to listen for n8n workflow updates:

    ```jsx
    useEffect(() => {
      const ws = new WebSocket("ws://<your-n8n-domain>/status");
      ws.onmessage = (event) => {
        const { videoId, status } = JSON.parse(event.data);
        setVideoStatus((prev) => ({ ...prev, [videoId]: status }));
      };
      return () => ws.close();
    }, []);
    ```

  - Display status next to each video in the list:

    ```jsx
    <ListItemText
      primary={
        <Tooltip title={videoId}>
          <span>Video {videoId.substring(0, 8)}...</span>
        </Tooltip>
      }
      secondary={videoStatus[videoId] || capitalizeFirstLetter(videoStatus)}
    />
    ```

#### 6. Optimize for Free-Tier Constraints

- **Purpose**: Ensure all solutions work within free-tier limits of Cloudflare, Vercel, and alternative APIs.
- **Enhancements**:
  - Use Cloudflare Workers for lightweight API calls and storage.
  - Minimize API usage by caching music and visuals locally or in Cloudflare R2.
  - Document setup in `README.md` for easy replication.
- **Steps**:

  - Deploy the unofficial Suno API on Cloudflare Workers instead of Vercel for lower costs:
    - Create a Worker script to proxy requests to `gcui-art/suno-api`.
    - Store cookies and 2Captcha keys in Workers Secrets.
  - Cache music files in Cloudflare R2 using a Put Object node in n8n:

    ```json
    {
      "bucket": "suno-music",
      "key": "{{$node['Generate Music'].json['id']}}.mp3",
      "body": "{{$node['Download Music'].binary.data}}"
    }
    ```

  - Update `docs/n8n-workflow.md` with instructions for setting up unofficial APIs, Beatoven.ai, and YuE, including free-tier limits.

#### 7. Test and Validate

- **Purpose**: Ensure reliability and compatibility with your Short Video Maker project.
- **Enhancements**:
  - Add automated tests for music generation endpoints.
  - Validate jewelry-themed music outputs for quality and relevance.
  - Integrate with your human quality assurance process.
- **Steps**:

  - Add a test suite in [`vitest.config.ts`](short-video-maker/vitest.config.ts) to check API responses:

    ```javascript
    import { describe, it, expect } from "vitest";
    describe("Music Generation", () => {
      it("generates music successfully", async () => {
        const response = await fetch(
          "http://localhost:3000/api/custom_generate",
          {
            method: "POST",
            body: JSON.stringify({ prompt: "upbeat pop" }),
          }
        );
        expect(response.status).toBe(200);
      });
    });
    ```

  - Test jewelry-themed prompts (e.g., “vintage necklace ad, upbeat pop”) and review outputs in Supabase or Notion.
  - Trigger the n8n workflow manually via the UI and verify notifications.
