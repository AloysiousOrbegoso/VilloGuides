import { TextBlock } from "./TextBlock";
import { StepsBlock } from "./StepsBlock";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { LinkBlock } from "./LinkBlock";
import { WifiBlock } from "./WifiBlock";
import { ContactBlock } from "./ContactBlock";
import { MapLinkBlock } from "./MapLinkBlock";
import { ListBlock } from "./ListBlock";
import { PrivateBlock } from "./PrivateBlock";
export function BlockRenderer({ block }) {
  switch (block.type) {
    case "text":
      return <TextBlock {...block} />;
    case "steps":
      return <StepsBlock {...block} />;
    case "image":
      return <ImageBlock {...block} />;
    case "video":
      return <VideoBlock {...block} />;
    case "link":
      return <LinkBlock {...block} />;
    case "wifi":
      return <WifiBlock {...block} />;
    case "contact":
      return <ContactBlock {...block} />;
    case "map-link":
      return <MapLinkBlock {...block} />;
    case "list":
      return <ListBlock {...block} />;
    case "private":
      return <PrivateBlock {...block} />;
  }
}
