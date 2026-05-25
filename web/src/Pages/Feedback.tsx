import { useState } from "react";
import Header from "../components/Nav/Header";
import Button from "../../../mobile/src/components/Buttons/Btn";
import TextInput from "../../../mobile/src/components/Input";
import { IoStar, IoStarOutline } from "react-icons/io5";
import { useToast } from "../Context/ToastContext/useToast";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

export default function Feedback() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayRating = hoverRating || rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Please enter your email.");
      return;
    }
    if (!SERVER_URL) {
      showToast("Feedback is not configured. Please try again later.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${SERVER_URL}/nvelopes/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          message: message.trim(),
          rating: rating || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      showToast("Thanks! Your feedback was sent.");
      setEmail("");
      setMessage("");
      setRating(0);
    } catch (e) {
      console.error("Error sending feedback", e);
      showToast("Could not send feedback. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-my-blue-dark text-my-white-dark">
      <Header links={[{ label: "Home", href: "/" }]} />
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 pt-16">
        <p className="text-center text-my-white-light max-w-md mb-8">
          Thanks for using Nvelopes. I really appreciate any feedback on the site, or if you just want to reach out.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-my-white-light">How would you rate Nvelopes?</span>
            <div className="flex gap-1" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none focus:ring-2 focus:ring-my-green-base rounded"
                  aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  aria-pressed={rating === star}
                >
                  {star <= displayRating ? (
                    <IoStar className="text-3xl text-my-green-base" />
                  ) : (
                    <IoStarOutline className="text-3xl text-my-white-dark" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="w-[90%] max-w-[20rem] flex flex-col items-center justify-center gap-2">
            <TextInput
              id="feedback-email"
              label="Email*"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="w-[90%] max-w-[20rem] flex flex-col items-center justify-center gap-2">
            <label className="p-2 w-full text-center" htmlFor="feedback-message">
              Message
            </label>
            <textarea
              id="feedback-message"
              placeholder="Your feedback or message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-full max-w-[20rem] text-my-black-dark box-border min-h-[8rem] resize-y"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            color="green"
            disabled={isSubmitting}
            onClick={() => {}}
          >
            {isSubmitting ? "Sending…" : "Send feedback"}
          </Button>
        </form>

        <footer className="mt-12 text-center text-sm text-my-white-light">
          <a
            href="https://www.leedyer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-my-green-base hover:underline"
          >
            www.leedyer.com
          </a>
          <span className="mx-2">·</span>
          <a href="mailto:lee.dyer.dev@gmail.com" className="text-my-green-base hover:underline">
            lee.dyer.dev@gmail.com
          </a>
        </footer>
      </div>
    </div>
  );
}
