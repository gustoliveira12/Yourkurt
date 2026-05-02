"use client";
import { Avatar, AvatarProps } from "./Avatar";

interface StoryProps extends AvatarProps {
  name: string;
  hasStory: boolean;
}

//TODO: CREATE HOVER | IDENTIFY POSTED STORIES
export default function Story({ src, name, hasStory }: StoryProps) {
  return (
    <div className="flex flex-col justify-center items-center gap-1.5 h-32">
      <Avatar isRead isStory sizes="xl" src={src} />
      <span
        title={name}
        className="text-center text-zinc-400 truncate min-w-full w-0 block"
      >
        {name}
      </span>
    </div>
  );
}
