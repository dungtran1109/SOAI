# ws_test_client.py
import asyncio
import json
import argparse
import websockets


async def reader(ws):
    try:
        async for msg in ws:
            try:
                print("[server] raw message:", msg)
            except Exception:
                data = msg
            # print("[server]", data)
    except Exception as e:
        print("[reader-error]", e)


async def run(url: str, token: str, conversation_id: str, model: str, user_text: str):
    print("[client] connecting to server:", url)
    async with websockets.connect(url) as ws:
        print("[client] connected to server")
        # 1) Handshake (first message must be USER_CONNECT)
        handshake = {
            "type": "user.connect",  # if it fails, try "user_connect"
            "data": {
                "conversation_id": conversation_id,
                "user_id": "user-123",
            },
        }
        await ws.send(json.dumps(handshake))
        print("[client] sent handshake")

        # Start reader task
        reader_task = asyncio.create_task(reader(ws))

        # 2) Send a sample user message
        if user_text:
            user_msg = {
                "type": "user.input_text.commit",  # if it fails, try "user_message"
                "data": user_text,
            }
            await ws.send(json.dumps(user_msg))
            print("[client] sent user message")

        # 3) Wait a bit for responses, then close
        try:
            await reader_task
        except KeyboardInterrupt:
            print("[client] interrupted, closing...")
        finally:
            try:
                await ws.close()
            except Exception:
                pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--url", default="ws://localhost:8006/realtime", help="WebSocket URL"
    )
    ap.add_argument(
        "--token", required=False, default="TEST-TOKEN", help="JWT or access token"
    )
    ap.add_argument(
        "--conversation-id", required=False, default="conv-123", help="Conversation ID"
    )
    ap.add_argument("--model", required=False, default="gpt-4-turbo", help="Model name")
    ap.add_argument(
        "--text", required=False, default="Hello from client", help="User text to send"
    )
    args = ap.parse_args()
    asyncio.run(run(args.url, args.token, args.conversation_id, args.model, args.text))


if __name__ == "__main__":
    main()
