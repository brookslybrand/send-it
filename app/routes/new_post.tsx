import { Form } from "remix";

export default function NewPost() {
  return (
    <Form>
      <label htmlFor="title">Title</label>
      <input id="title" />

      <label htmlFor="content">content</label>
      <textarea id="content" />

      <button type="submit">Create post</button>
    </Form>
  );
}
