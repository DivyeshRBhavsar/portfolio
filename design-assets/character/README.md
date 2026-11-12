# Design assets

Reference files for Luffy, the site's guide character. They are **not** used by the site
and live outside `public/` so they're never deployed. The clips the site plays are in
`public/character/`.

## character/

- `hello-wave.webm`, `hello-wave.webp`: the original wave clip (5 s). Replaced on the site by `welcome.*`, which joins the wave and namaste into one clip.
- `namaste.webm`, `namaste.webp`: the original namaste clip (5 s). Replaced on the site by `welcome.*`.
- `clipB_start_frame_3.png`: the Kling start frame used to generate clips in Luffy's neutral pose. Use it as both the **start and end frame** in Kling for any new clip, so the clip begins and ends on the same pose as `public/character/neutral-pose.png` and swaps seamlessly with the idle still.
