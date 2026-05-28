import { useState } from 'react';

function OOTDForm({ workspaceId, onSubmit }) {
  const [form, setForm] = useState({
    author: '',
    rating_infrastructure: 3,
    rating_atmosphere: 3,
    rating_furniture: 3,
    rating_comfort: 3,
    comment: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({ ...form, workspace: workspaceId });
  };

  return (
    <form className="ootd-form" onSubmit={handleSubmit}>
      {/* Review form for a workspace */}
      <input name="author" value={form.author} onChange={handleChange} placeholder="작성자" required />
      <textarea name="comment" value={form.comment} onChange={handleChange} placeholder="한 줄 후기" />
      <button type="submit">리뷰 등록</button>
    </form>
  );
}

export default OOTDForm;
