import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Send } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reported: boolean;
  reporting: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, reported: false, reporting: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  handleReport = async () => {
    if (this.state.reporting || this.state.reported) return;
    this.setState({ reporting: true });
    try {
      const token = localStorage.getItem("ba_token") || "";
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "reportError",
          message: `[자동] 앱 충돌: ${this.state.error?.message || "알 수 없는 오류"}`,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          stack: this.state.error?.stack || "",
        }),
      });
      this.setState({ reported: true });
    } catch {
      // 실패해도 무시
    } finally {
      this.setState({ reporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-2">예상치 못한 오류가 발생했어요</h2>
            <p className="text-sm text-muted-foreground mb-6">아래 정보를 신고하면 빠르게 수정할게요</p>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-muted text-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                페이지 새로고침
              </button>

              <button
                onClick={this.handleReport}
                disabled={this.state.reporting || this.state.reported}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
                  "cursor-pointer transition-all",
                  this.state.reported
                    ? "bg-green-500/20 text-green-500"
                    : "bg-destructive text-destructive-foreground hover:opacity-90"
                )}
              >
                <Send size={16} />
                {this.state.reporting ? "전송 중..." : this.state.reported ? "신고 완료 ✓" : "오류 신고하기"}
              </button>
            </div>

            {this.state.reported && (
              <p className="text-xs text-muted-foreground mt-4">신고가 접수되었어요. 확인 후 수정할게요!</p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
