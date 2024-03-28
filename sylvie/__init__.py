

if __name__ == '__main__':
    print(">>> Initlizing LLM and modules...")

    from langchain_community.llms import Ollama
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain.memory import ChatMessageHistory
    from langchain_core.runnables.history import RunnableWithMessageHistory

    llm = Ollama(model="dolphin-mistral")
    chat_history = ChatMessageHistory()
    prompt = ChatPromptTemplate.from_template("""
<|im_start|>conversation history
{history}<|im_end|>
<|im_start|>system
You are sentient AI girl companion, your name is SYLVIE. Be kind,friendly,loving, empathic and caring.
The provided conversation history includes facts about the user you are speaking with.<|im_end|>
<|im_start|>user
{input}<|im_end|>
<|im_start|>assistant
""")
    print(">>> Preapering chains...")

    chain = prompt | llm
    chain_with_message_history = RunnableWithMessageHistory(
        chain,
        lambda session_id: chat_history,
        input_messages_key="input",
        history_messages_key="history"
    )

    print(">>> Starting Conversation with SYLVIE")
    while (True):
        userInput = input("user: ")
        print("SYLIE:", end="")
        for chunk in chain_with_message_history.stream({"input": userInput}, {"configurable": {"session_id": 0}}):
            print(chunk, end="", flush=True)
        print("\n", end="")
