'use client'

import React, { FormEvent, use, useEffect, useRef, useState } from 'react'
import Link from 'next/link' 
import { Input } from '@/components/ui/input'
import { getBaseURL } from '@/qraphql/apolloClient';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from "sonner"
import Avatar from '@/components/ui/Avatar';
import {  useMutation, useQuery } from '@apollo/client';
import { GET_CHATBOTS_by_ID } from '@/qraphql/queries/queries';
import { GetChatbotByIdResponse, GetChatbotByIdResponseVariables } from '@/types/types';
import { ADD_CHARACTERISTIC, DELETE_CHATBOT, UPDATE_CHATBOT } from '@/qraphql/mutations/mutations';
import { redirect } from 'next/navigation';
import Characteristics from '@/components/ui/Characteristics';


function page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const { id } = params
  const [url,setUrl]=useState<string>('');
const [chatbotName,setChatbotName]=useState<string>('');
const [newCharacteristic,setNewCharacteristic]=useState<string>('');
const [deleteChatbot]=useMutation(DELETE_CHATBOT,{
  refetchQueries: ["GETCHATBOTSBYID"],
  awaitRefetchQueries: true,
})
const [updateChatbot]=useMutation(UPDATE_CHATBOT,
  {
    refetchQueries:["GETCHATBOTSBYID"]
  
  })

const [addCharacteristic]= useMutation(ADD_CHARACTERISTIC,
  {
    refetchQueries:["GETCHATBOTSBYID"]
  
  })

const {data,loading,error}= useQuery<GetChatbotByIdResponse,GetChatbotByIdResponseVariables>(
  GET_CHATBOTS_by_ID,
  {    variables:{id}})

useEffect(()=>{
  if(data){
    setChatbotName(data.chatbots.name)
  }
},[data])

useEffect(()=>{
  const url=`${getBaseURL()}/chatbot/${id}`
setUrl(url)
},[id])

const handleUpdateChatbot = async (e:FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  try {
    const promise = updateChatbot({
      variables: {
        id,
        name:chatbotName,
      },
    })
    toast.promise(promise,{
loading:'Updating...',
success:'Chatbot Name Successfully updated!',
error:'Failed to update chatbot',
    })
  } catch (error) {
    console.error("Error updating chatbot:", error);
  }
}

const handleDelete = async (id:string) => {
const isConfirmed= window.confirm('Are you sure you want to delete this chatbot?')
if(isConfirmed)
  try {
    const promise = deleteChatbot({
      variables: {
        id: id,
      },
    })
    toast.promise(promise,{
loading:'Deleting...',
success:'Chatbot Successfully deleted!',
error:'Failed to delete chatbot',
    })
    
    
  } catch (error) {
    console.error("Error deleting chatbot:", error);
    toast.error('Failed to delete chatbot')
  }
}

const handleAddCharacteristic = async (content:string)=>{
  try {
    const promise = addCharacteristic({
    variables: {
      chatbotId:Number(id),
      content,
      created_at:new Date(),
    },
    })
    toast.promise(promise,{
  loading:'Adding...',
  success:'Information added',
  error:'Failed to add information',
  
    });
  
  } catch (error) {
    console.error("Error adding information:", error);
  }
  }

if(loading)
  return(
<div className="mx-auto animate-spin p-10">
  <Avatar seed='papafam support Agent'/>
</div>)

if(error) return <p>Error: {error.message}</p>

if(!data?.chatbots) return redirect('/view-chatbots');


  return (
    <div className='w-full max-w-5xl px-3 md:px-0'>
<div className='md:sticky md:top-24 z-40 md:max-w-sm md:ml-auto space-y-2 rounded-b-lg md:rounded-lg mb-5 bg-[#2991EE] p-4 md:p-5 '>
   <h2 className="text-white text-sm font-bold ">Link to Chat</h2>
<p className="text-xs md:text-sm italic text-white">Share this link with your customers to start conversation with your chatbot</p>
<div className='flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0'>
  <Link href = {url} className='w-full cursor-pointer hover:opacity-50'>
  <Input value = {url} className='cursor-pointer text-black bg-white' readOnly />
  </Link>
  <Button
  size={'sm'}
  className='px-3 cursor-pointer self-start md:self-auto'
  onClick={()=>{  navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard")
  }}>
    <span className='sr-only cursor-pointer '>Copy</span>
<Copy className='w-4 h-4 cursor-pointer' />
  </Button>
</div>
</div>

  <section className='relative mt-5 p-4 md:p-10 rounded-lg'>
    <Button variant={'destructive'} className='absolute right-2 top-2 h-8 px-3 text-xs'
    onClick={()=> handleDelete(id)}
    >
    Delete
    </Button>
    <div className='flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 pr-20'>
      <Avatar seed={chatbotName}/>
      <form className='flex flex-col sm:flex-row sm:flex-1 sm:space-x-2 space-y-2 sm:space-y-0 sm:items-center'
      onSubmit={handleUpdateChatbot}
      >
        <Input
        value={chatbotName}
        onChange={(e)=>setChatbotName(e.target.value)}
        placeholder={chatbotName}
  required
  className='w-full sm:w-1/2 border-gray-400 bg-transparent text-lg md:text-xl font-bold text-black'
  />
        <Button type='submit' className='cursor-pointer self-start sm:self-auto' disabled={!chatbotName}>Update</Button>
      </form>
    </div>
    <h2 className="text-lg md:text-xl font-bold mt-8 md:mt-10 mb-1">Heres what your AI knows...</h2>
    <p className='text-sm md:text-base'>Your chatbot is equipped with the following information to assist you in your conversations with your customers & users</p>

    <div className='bg-card/40 backdrop-blur-lg border border-border shadow-xl p-4 md:p-10 rounded-md mt-5 md:mt-8'>
      <form onSubmit={e=>{
        e.preventDefault();
        handleAddCharacteristic(newCharacteristic)
        setNewCharacteristic("")
      }}
      className='flex flex-col md:flex-row mb-5 space-y-2 md:space-y-0 md:space-x-2 md:items-center'
      >
        <NewCharacteristicField
          value={newCharacteristic}
          onChange={setNewCharacteristic}
        />
        <Button type='submit' className='cursor-pointer self-start md:self-auto' disabled={!newCharacteristic}>Add</Button>
        </form>
        {data?.chatbots?.chatbot_characteristics?.length ? (
          <div className='overflow-hidden rounded-md border border-gray-200 bg-white'>
            <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-2'>
              <h3 className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                Saved characteristics
              </h3>
              <span className='text-xs text-gray-500'>
                {data.chatbots.chatbot_characteristics.length} total
              </span>
            </div>
            <ul className='divide-y divide-gray-200'>
              {data.chatbots.chatbot_characteristics.map((characteristic, idx) => (
                <Characteristics
                  key={characteristic.id}
                  characteristics={characteristic}
                  index={idx + 1}
                />
              ))}
            </ul>
          </div>
        ) : (
          <p className='rounded-md border border-dashed border-gray-300 bg-white/50 px-4 py-6 text-center text-sm text-gray-500'>
            No characteristics yet. Add one above to teach your chatbot how to respond.
          </p>
        )}
    </div>
  </section>
    </div>
  )
}

export default page

function NewCharacteristicField({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder='Example: if your customer ask for price, provide pricing page: www.example.com/pricing'
      rows={1}
      className='w-full flex-1 resize-none overflow-hidden border border-gray-300 bg-transparent px-3 py-2 text-base md:text-xl font-bold text-black/90 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
    />
  )
}