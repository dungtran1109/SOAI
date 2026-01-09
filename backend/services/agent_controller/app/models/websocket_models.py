from enum import Enum
from fastapi import WebSocket
import urllib.parse
import base64


class WebsocketMessageType(Enum):
    USER_INIT_CONVERSATION = "user.init.conversation"

    USER_INPUT_TEXT_COMMIT = "user.input_text.commit"
    USER_INPUT_AUDIO_BUFFER_APPEND = "user.input_audio_buffer.append"
    AGENT_INPUT_AUDIO_BUFFER_APPEND = "agent.input_audio_buffer.append"

    USER_SPEECH_STARTED = "user.input_audio_buffer.speech_started"
    AGENT_SPEECH_STARTED = "agent.input_audio_buffer.speech_started"

    USER_SPEECH_FINISHED = "user.input_audio_buffer.speech_finished"
    AGENT_SPEECH_FINISHED = "agent.input_audio_buffer.speech_finished"

    USER_CONVERSATION_ITEM = "user.conversation_item.committed"
    AGENT_CONVERSATION_ITEM = "agent.conversation_item.committed"

    USER_CONNECT = "user.connect"
    USER_RESUME = "user.resume"
    USER_DISCONNECTED = "user.disconnected"

    USER_SET_CONFIGURATION = "user.set_configuration"
    SYSTEM_CONFIGURATION_UPDATED = "system.configuration.updated"

    AGENT_INTERACTION_SHOW_TEXT = "agent.interaction.show_text"

    AGENT_CONVERSATION_STATE_UPDATED = "agent.conversation_state.updated"

    TOKEN_EXPIRED = "token.expired"

    # Keep-alive ping/pong
    PING = "ping"
    PONG = "pong"

    ERROR = "error"


def _parse_params(data) -> dict:
    """
    Robustly parse params from dict / bytes / query-string.
    - Decodes percent-encoding
    - Keeps blank values
    - Ignores malformed segments
    - Last occurrence wins on duplicate keys
    """
    if isinstance(data, dict):
        return {str(k): str(v) if v is not None else "" for k, v in data.items()}

    if isinstance(data, (bytes, bytearray)):
        s = data.decode("utf-8", "ignore")
    else:
        s = str(data or "")

    params = {}
    # parse_qsl returns list of (key, value), handles percent-decoding
    for k, v in urllib.parse.parse_qsl(s, keep_blank_values=True, strict_parsing=False):
        params[k] = v
    return params


class WebsocketMessage:
    type: WebsocketMessageType
    data: str

    def __init__(self, type: WebsocketMessageType, data: str | bytes = None, text=True):
        """
        Create a new WSAPIMessage
        Args:
            type (WSAPIMessageType): The type of the message
            data (str | bytess): The data of the message
            text (bool, optional): If the data is text. Defaults to True. If False, the data will be base64 encoded.
        """
        self.type = type
        if not text:
            self.data = base64.b64encode(data).decode("utf-8")
        else:
            self.data = data

    def __str__(self):
        return f"WebsocketMessage(type={self.type}, data={self.data})"

    @classmethod
    def is_json_of(cls, type: WebsocketMessageType, jsonobject: dict):
        return jsonobject["type"] == type.value

    @classmethod
    def from_json(cls, jsonobject: dict):
        if "type" not in jsonobject:
            raise ValueError("type is not in jsonobject")
        data = ""
        if "data" in jsonobject:
            data = jsonobject["data"]
        return cls(WebsocketMessageType(jsonobject["type"]), data)


class WebsocketConfigurationMessage(WebsocketMessage):
    def __init__(self, string_data: str | dict | bytes):
        super().__init__(
            WebsocketMessageType.USER_SET_CONFIGURATION, string_data, text=True
        )

    def params_dict(self) -> dict:
        return _parse_params(self.data)

    def get_param(self, key: str) -> str:
        d = self.params_dict()
        return d.get(key, "")


class WebsocketConnectMessage(WebsocketMessage):
    def __init__(self, string_data: str | dict | bytes):
        """
        Accepts query-string (e.g. "key1=value1&key2=value2") or a dict JSON.
        Must contain 'token' (or 'accessToken') and 'conversation_id' (or 'conversationId').
        """
        super().__init__(WebsocketMessageType.USER_CONNECT, string_data, text=True)
        # if self.auth_token() == "":
        #     raise ValueError("token is empty")
        if self.conversation_id() == "":
            raise ValueError("conversation_id is empty")

    def configuration(self) -> dict:
        d = {}
        params_dict = self.params_dict()
        for key, value in params_dict.items():
            if key not in ("token", "accessToken", "conversation_id", "conversationId"):
                d[key] = value
        return d

    def params_dict(self) -> dict:
        return _parse_params(self.data)

    def get_param(self, key: str) -> str:
        d = self.params_dict()
        return d.get(key, "")

    def auth_token(self) -> str:
        d = self.params_dict()
        # Support both snake and camel case
        return d.get("token") or d.get("accessToken", "")

    def conversation_id(self) -> str:
        d = self.params_dict()
        # Support both snake and camel case
        return d.get("conversation_id") or d.get("conversationId", "")

    def user_id(self) -> str:
        d = self.params_dict()
        return d.get("user_id") or d.get("userId", "")

    @classmethod
    def from_msg(cls, msg: WebsocketMessage):
        if msg.type != WebsocketMessageType.USER_CONNECT:
            raise ValueError(f"Expected USER_CONNECT, got {msg.type}")
        return cls(msg.data)


class WebsocketResumeMessage(WebsocketMessage):
    def __init__(self, last_conversation_item_id: str):
        super().__init__(
            WebsocketMessageType.USER_RESUME, last_conversation_item_id, text=True
        )

    def conversation_item_id(self) -> str:
        return self.data


class WebsocketErrorMessage(WebsocketMessage):
    def __init__(self, error: str):
        super().__init__(WebsocketMessageType.ERROR, error, text=True)
