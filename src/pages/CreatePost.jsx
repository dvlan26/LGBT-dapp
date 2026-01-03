import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { generateSymmetricKeyBase64, encryptWithSymKey, encryptSymKeyWithPublicKey, uploadToIPFSStub } from '../utils/crypto';
import { createPostOnChain, getEncryptionPublicKeyOnChain } from '../lib/socialContract';
import { toast } from 'react-hot-toast';

const CreatePost = () => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.walletAddress) {
      toast.error('请先连接钱包');
      return;
    }
    setLoading(true);
    try {
      const symKey = generateSymmetricKeyBase64();
      const enc = await encryptWithSymKey(symKey, content);
      const blob = JSON.stringify({ ciphertext: enc.ciphertext, iv: enc.iv });
      const cid = await uploadToIPFSStub(blob);

      const recipientsArr = recipients.split(',').map(r => r.trim()).filter(Boolean);
      const encryptedKeys = [];

      for (const r of recipientsArr) {
        const pubKey = await getEncryptionPublicKeyOnChain(r);
        if (!pubKey || pubKey.length === 0) {
          // recipient has no encryption key registered; push empty placeholder
          encryptedKeys.push('');
        } else {
          const encSymKey = await encryptSymKeyWithPublicKey(pubKey, symKey);
          encryptedKeys.push(encSymKey);
        }
      }

      // Store cid and encrypted symmetric keys on-chain
      const tx = await createPostOnChain(cid, recipientsArr, encryptedKeys);
      toast.success('帖子已提交，等待链上确认');
      await tx.wait();
      toast.success('帖子已确认');
      setContent('');
      setRecipients('');
    } catch (err) {
      console.error(err);
      toast.error('发布失败: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">创建加密帖子</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={6}
            placeholder="输入你的内容（将会被对称加密并上传到IPFS）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            className="w-full p-3 border rounded-lg"
            placeholder="接收者地址, 用逗号分隔（如果为空表示公开）"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
          />

          <div>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg" disabled={loading}>
              {loading ? '发布中...' : '发布加密帖子'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
