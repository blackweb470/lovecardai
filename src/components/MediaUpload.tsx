import { useState, useRef } from "react";
import { Upload, X, Image, Film } from "lucide-react";
import { toast } from "sonner";

interface MediaUploadProps {
  mediaFile: File | null;
  mediaPreview: string | null;
  onFileSelect: (file: File | null, preview: string | null) => void;
}

const MAX_VIDEO_DURATION = 10; // seconds
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const MediaUpload = ({ mediaFile, mediaPreview, onFileSelect }: MediaUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large! Max 20MB.");
      return;
    }

    if (file.type.startsWith("video")) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          toast.error(`Video must be ${MAX_VIDEO_DURATION} seconds or less!`);
          return;
        }
        const preview = URL.createObjectURL(file);
        onFileSelect(file, preview);
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith("image")) {
      const preview = URL.createObjectURL(file);
      onFileSelect(file, preview);
    } else {
      toast.error("Please upload an image or video file.");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    onFileSelect(null, null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Add a photo or video (optional)
      </label>

      {mediaPreview ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
          {mediaFile?.type.startsWith("video") ? (
            <video
              src={mediaPreview}
              controls
              className="w-full max-h-48 object-cover"
            />
          ) : (
            <img
              src={mediaPreview}
              alt="Upload preview"
              className="w-full max-h-48 object-cover"
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/80 text-background hover:bg-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
        >
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            <Film className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Upload image or video (max 10s)</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default MediaUpload;
